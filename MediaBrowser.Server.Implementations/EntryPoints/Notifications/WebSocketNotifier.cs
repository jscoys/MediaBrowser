﻿using MediaBrowser.Common.Net;
using MediaBrowser.Controller.Notifications;
using MediaBrowser.Controller.Plugins;
using System.Linq;

namespace MediaBrowser.Server.Implementations.EntryPoints.Notifications
{
    /// <summary>
    /// Sends out messages anytime a notification is added or udpated
    /// </summary>
    public class WebSocketNotifier : IServerEntryPoint
    {
        private readonly INotificationsRepository _notificationsRepo;

        private readonly IServerManager _serverManager;

        public WebSocketNotifier(INotificationsRepository notificationsRepo, IServerManager serverManager)
        {
            _notificationsRepo = notificationsRepo;
            _serverManager = serverManager;
        }

        public void Run()
        {
            _notificationsRepo.NotificationAdded += _notificationsRepo_NotificationAdded;
            _notificationsRepo.NotificationUpdated += _notificationsRepo_NotificationUpdated;

            _notificationsRepo.NotificationsMarkedRead += _notificationsRepo_NotificationsMarkedRead;
        }

        void _notificationsRepo_NotificationsMarkedRead(object sender, NotificationReadEventArgs e)
        {
            var list = e.IdList.Select(i => i.ToString("N")).ToList();

            list.Add(e.UserId.ToString("N"));
            list.Add(e.IsRead.ToString().ToLower());

            var msg = string.Join("|", list.ToArray());

            _serverManager.SendWebSocketMessage("NotificationsMarkedRead", msg);
        }

        void _notificationsRepo_NotificationUpdated(object sender, NotificationUpdateEventArgs e)
        {
            var msg = e.Notification.UserId + "|" + e.Notification.Id;

            _serverManager.SendWebSocketMessage("NotificationUpdated", msg);
        }

        void _notificationsRepo_NotificationAdded(object sender, NotificationUpdateEventArgs e)
        {
            var msg = e.Notification.UserId + "|" + e.Notification.Id;

            _serverManager.SendWebSocketMessage("NotificationAdded", msg);
        }

        public void Dispose()
        {
            _notificationsRepo.NotificationAdded -= _notificationsRepo_NotificationAdded;
            _notificationsRepo.NotificationUpdated -= _notificationsRepo_NotificationUpdated;
        }
    }
}