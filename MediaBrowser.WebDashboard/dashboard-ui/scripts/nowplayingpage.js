﻿(function (window, document, $, setTimeout, clearTimeout) {

    var currentPlayer;
    var lastPlayerState;
    var isPositionSliderActive;

    function showAudioMenu(page, item) {

        var streams = (item.MediaStreams || []).filter(function (i) {

            return i.Type == 'Audio';
        });

        var elem = $('#popupAudioTrackMenu', page);

        var html = '<ul data-role="listview" data-inset="true" style="min-width: 210px;"><li data-role="list-divider">Select Audio</li>';

        html += streams.map(function (s) {

            var streamHtml = '<li><a data-index="' + s.Index + '" href="#" style="font-size:15px;" class="lnkTrackOption"><h3>';

            streamHtml += (s.Codec || '').toUpperCase();

            if (s.Profile) {
                streamHtml += ' ' + s.Profile;
            }

            streamHtml += '</h3><p>';

            var extras = [];

            if (s.Language) {
                extras.push(s.Language);
            }
            if (s.Layout) {
                extras.push(s.Layout);
            }
            else if (s.Channels) {
                extras.push(s.Channels + ' ch');
            }

            if (s.BitRate) {
                extras.push((parseInt(s.BitRate / 1000)) + ' kbps');
            }

            streamHtml += extras.join(' - ');

            streamHtml += '</p></a></li>';

            return streamHtml;

        }).join('');

        html += '</ul>';

        $('.trackList', elem).html(html).listview('refresh').trigger('create');

        elem.popup('open');
    }

    function showSubtitleMenu(page, item) {

        var streams = (item.MediaStreams || []).filter(function (i) {

            return i.Type == 'Subtitle';
        });

        var elem = $('#popupSubtitleTrackMenu', page);

        var html = '<li data-role="list-divider">Select Subtitles</li>';

        html += '<li><a href="#" style="font-size:15px;" data-index="-1" class="lnkTrackOption"><h3>Off</h3></a></li>';

        html += streams.map(function (s) {

            var streamHtml = '<li><a data-index="' + s.Index + '" href="#" style="font-size:15px;" class="lnkTrackOption"><h3>';

            streamHtml += (s.Language || 'Unknown language');

            if (s.IsDefault && s.IsForced) {
                streamHtml += ' (Default/Forced)';
            }
            else if (s.IsDefault) {
                streamHtml += ' (Default)';
            }
            else if (s.IsForced) {
                streamHtml += ' (Forced)';
            }

            streamHtml += '</h3><p>';

            streamHtml += (s.Codec || '').toUpperCase();

            streamHtml += '</p></a></li>';

            return streamHtml;

        }).join('');

        $('.trackList', elem).html(html).listview('refresh').trigger('create');

        elem.popup('open');
    }

    function bindEvents(page) {

        $('.tabButton', page).on('click', function () {

            var elem = $('.' + this.getAttribute('data-tab'), page);
            elem.siblings('.tabContent').hide();

            elem.show();

            $('.tabButton', page).removeClass('ui-btn-active');
            $(this).addClass('ui-btn-active');
        });

        $('.btnCommand,.btnToggleFullscreen', page).on('click', function () {

            if (currentPlayer) {
                MediaController.sendCommand({
                    Name: this.getAttribute('data-command')

                }, currentPlayer);
            }
        });

        $('#popupAudioTrackMenu', page).on('click', '.lnkTrackOption', function () {

            if (currentPlayer && lastPlayerState) {

                var index = this.getAttribute('data-index');

                currentPlayer.setAudioStreamIndex(parseInt(index));

                $('#popupAudioTrackMenu', page).popup('close');
            }
        });

        $('#popupSubtitleTrackMenu', page).on('click', '.lnkTrackOption', function () {

            if (currentPlayer && lastPlayerState) {
                var index = this.getAttribute('data-index');

                currentPlayer.setSubtitleStreamIndex(parseInt(index));

                $('#popupSubtitleTrackMenu', page).popup('close');
            }
        });

        $('.btnAudioTracks', page).on('click', function () {

            if (currentPlayer && lastPlayerState) {
                showAudioMenu(page, lastPlayerState.NowPlayingItem);
            }
        });

        $('.btnSubtitles', page).on('click', function () {

            if (currentPlayer && lastPlayerState) {
                showSubtitleMenu(page, lastPlayerState.NowPlayingItem);
            }
        });

        $('.btnChapters', page).on('click', function () {

            if (currentPlayer && lastPlayerState) {
            }
        });

        $('.btnStop', page).on('click', function () {

            if (currentPlayer) {
                currentPlayer.stop();
            }
        });

        $('.btnPlay', page).on('click', function () {

            if (currentPlayer) {
                currentPlayer.unpause();
            }
        });

        $('.btnPause', page).on('click', function () {

            if (currentPlayer) {
                currentPlayer.pause();
            }
        });

        $('.btnNextTrack', page).on('click', function () {

            if (currentPlayer) {
                currentPlayer.nextTrack();
            }
        });

        $('.btnPreviousTrack', page).on('click', function () {

            if (currentPlayer) {
                currentPlayer.previousTrack();
            }
        });

        $('.positionSlider', page).on('slidestart', function () {

            isPositionSliderActive = true;

        }).on('slidestop', function () {

            isPositionSliderActive = false;

            if (currentPlayer && lastPlayerState) {

                var newPercent = parseFloat(this.value);
                var newPositionTicks = (newPercent / 100) * lastPlayerState.NowPlayingItem.RunTimeTicks;

                currentPlayer.seek(Math.floor(newPositionTicks));
            }
        });
    }

    function onPlaybackStart(e, state) {

        var player = this;

        player.beginPlayerUpdates();

        onStateChanged.call(player, e, state);
    }

    function onPlaybackStopped(e, state) {

        var player = this;

        player.endPlayerUpdates();

        onStateChanged.call(player, e, {});
    }

    function onStateChanged(e, state) {

        updatePlayerState($.mobile.activePage, state);
    }

    function showButton(button) {
        button.removeClass('hide');
    }

    function hideButton(button) {
        button.addClass('hide');
    }

    function hasStreams(item, type) {
        return item && item.MediaStreams && item.MediaStreams.filter(function (i) {
            return i.Type == type;
        }).length > 0;
    }

    function updatePlayerState(page, state) {

        lastPlayerState = state;

        var item = state.NowPlayingItem;

        var playerInfo = MediaController.getPlayerInfo();

        var supportedCommands = playerInfo.supportedCommands;

        $('.btnToggleFullscreen', page).buttonEnabled(item && item.MediaType == 'Video' && supportedCommands.indexOf('ToggleFullscreen') != -1);

        $('.btnAudioTracks', page).buttonEnabled(hasStreams(item, 'Audio') && supportedCommands.indexOf('SetAudioStreamIndex') != -1);
        $('.btnSubtitles', page).buttonEnabled(hasStreams(item, 'Subtitle') && supportedCommands.indexOf('SetSubtitleStreamIndex') != -1);
        $('.btnChapters', page).buttonEnabled(item && item.Chapters && item.Chapters.length);

        $('.sendMessageElement', page).buttonEnabled(supportedCommands.indexOf('DisplayMessage') != -1);

        $('.btnStop', page).buttonEnabled(item != null);
        $('.btnNextTrack', page).buttonEnabled(item != null);
        $('.btnPreviousTrack', page).buttonEnabled(item != null);

        var btnPause = $('.btnPause', page).buttonEnabled(item != null);
        var btnPlay = $('.btnPlay', page).buttonEnabled(item != null);

        var playState = state.PlayState || {};

        if (playState.IsPaused) {

            hideButton(btnPause);
            showButton(btnPlay);

        } else {

            showButton(btnPause);
            hideButton(btnPlay);
        }

        if (!isPositionSliderActive) {

            var positionSlider = $('.positionSlider', page);

            if (item && item.RunTimeTicks) {

                var pct = playState.PositionTicks / item.RunTimeTicks;
                pct *= 100;

                positionSlider.val(pct);

            } else {

                positionSlider.val(0);
            }

            if (playState.CanSeek) {
                positionSlider.slider("enable");
            } else {
                positionSlider.slider("disable");
            }

            positionSlider.slider('refresh');
        }

        if (playState.PositionTicks == null) {
            $('.positionTime', page).html('--:--');
        } else {
            $('.positionTime', page).html(Dashboard.getDisplayTime(playState.PositionTicks));
        }

        if (item && item.RunTimeTicks != null) {
            $('.runtime', page).html(Dashboard.getDisplayTime(item.RunTimeTicks));
        } else {
            $('.runtime', page).html('--:--');
        }

        if (item && item.MediaType == 'Video') {
            $('.videoButton', page).css('visibility', 'visible');
        } else {
            $('.videoButton', page).css('visibility', 'hidden');
        }

        updateNowPlayingInfo(page, state);
    }

    var currentImgUrl;
    function updateNowPlayingInfo(page, state) {

        var item = state.NowPlayingItem;

        $('.itemName', page).html(item ? MediaPlayer.getNowPlayingNameHtml(state) : '');

        var url;

        if (!item) {
        }
        else if (item.PrimaryImageTag) {

            url = ApiClient.getImageUrl(item.PrimaryImageItemId, {
                type: "Primary",
                height: 600,
                tag: item.PrimaryImageTag
            });
        }
        else if (item.BackdropImageTag) {

            url = ApiClient.getImageUrl(item.BackdropItemId, {
                type: "Backdrop",
                height: 600,
                tag: item.BackdropImageTag,
                index: 0
            });

        } else if (item.ThumbImageTag) {

            url = ApiClient.getImageUrl(item.ThumbImageItemId, {
                type: "Thumb",
                height: 600,
                tag: item.ThumbImageTag
            });
        }

        if (url == currentImgUrl) {
            return;
        }

        setImageUrl(page, url);
    }

    function setImageUrl(page, url) {
        currentImgUrl = url;

        $('.nowPlayingPageImage', page).html(url ? '<img src="' + url + '" />' : '');
    }

    function updateSupportedCommands(page, commands) {

        $('.btnCommand', page).each(function () {

            $(this).buttonEnabled(commands.indexOf(this.getAttribute('data-command')) != -1);

        });
    }

    function releaseCurrentPlayer() {

        if (currentPlayer) {

            $(currentPlayer).off('.nowplayingpage');
            currentPlayer.endPlayerUpdates();
            currentPlayer = null;
        }
    }

    function bindToPlayer(page, player) {

        releaseCurrentPlayer();

        currentPlayer = player;

        player.getPlayerState().done(function (state) {

            if (state.NowPlayingItem) {
                player.beginPlayerUpdates();
            }

            onStateChanged.call(player, { type: 'init' }, state);
        });

        $(player).on('playbackstart.nowplayingpage', onPlaybackStart)
            .on('playbackstop.nowplayingpage', onPlaybackStopped)
            .on('volumechange.nowplayingpage', onStateChanged)
            .on('playstatechange.nowplayingpage', onStateChanged)
            .on('positionchange.nowplayingpage', onStateChanged);

        var playerInfo = MediaController.getPlayerInfo();

        var supportedCommands = playerInfo.supportedCommands;

        updateSupportedCommands(page, supportedCommands);
    }

    $(document).on('pageinit', "#nowPlayingPage", function () {

        var page = this;

        bindEvents(page);

    }).on('pageshow', "#nowPlayingPage", function () {

        var page = this;

        $('.tabButton:first', page).trigger('click');

        $(function () {

            $(MediaController).on('playerchange.nowplayingpage', function () {

                bindToPlayer(page, MediaController.getCurrentPlayer());
            });

            bindToPlayer(page, MediaController.getCurrentPlayer());

        });

    }).on('pagehide', "#nowPlayingPage", function () {

        releaseCurrentPlayer();

        $(MediaController).off('playerchange.nowplayingpage');

        lastPlayerState = null;
    });

    window.NowPlayingPage = {

        onMessageSubmit: function () {

            var form = this;

            MediaController.sendCommand({
                Name: 'DisplayMessage',
                Arguments: {

                    Header: $('#txtMessageTitle', form).val(),
                    Text: $('#txtMessageText', form).val()
                }

            }, currentPlayer);

            $('input', form).val('');
            Dashboard.alert('Message sent.');

            return false;
        }

    };

})(window, document, jQuery, setTimeout, clearTimeout);