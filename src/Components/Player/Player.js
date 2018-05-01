import { h, Component } from "preact"
import { connect } from "preact-redux"
import styled from "styled-components"
import throttle from "lodash.throttle"

import Slider from "../Slider/Slider"

import {
  play_next,
  on_play,
  on_pause,
  change_time,
  change_duration,
  on_load_start
} from "@/store/actions"

import PlayerControls from "./PlayerControls"

const Wrapper = styled.div`
  background: ${props => (props.online ? "#fff" : "#ef5350")};
  position: fixed;
  bottom: 0px;
  left: 0px;
  width: 100%;
  height: 45px;
  display: flex;
  transform: ${props => (props.visible ? "translateY(0)" : "translateY(100%)")};
  transition: transform 500ms ease;

  @media screen and (min-width: 500px) {
    padding-left: 220px;
  }
`

class Player extends Component {
  componentDidMount() {
    const { playNext, playPrev } = this.props
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused"
      navigator.mediaSession.setActionHandler("previoustrack", playPrev)
      navigator.mediaSession.setActionHandler("play", this.togglePlay)
      navigator.mediaSession.setActionHandler("pause", this.togglePlay)
      navigator.mediaSession.setActionHandler("nexttrack", playNext)
    } else {
      window.addEventListener("keydown", ({ code }) => {
        if (code === "MediaPlayPause") this.togglePlay()
        if (code === "MediaTrackNext") playNext()
        if (code === "MediaTrackPrevious") playPrev()
      })
    }
  }
  componentWillReceiveProps(nextProps) {
    if ("mediaSession" in navigator) {
      /* eslint-disable */
      navigator.mediaSession.metadata = new MediaMetadata({
        title: nextProps.currentSong.title,
        artist: nextProps.currentSong.user,
        artwork: [
          {
            src: nextProps.currentSong.artworkOriginal.replace(
              "large",
              "t500x500"
            ),
            sizes: "500x500",
            type: "image/jpg"
          }
        ]
      })
      /* eslint-enable */
    }
  }

  onLoadedMetadata = () => {
    this.props.changeDuration(this.audio.duration)
    this.audio.play()
  }

  onTimeUpdate = () => {
    this.props.changeTime(this.audio.currentTime)
  }

  changeTime = newTime => {
    this.audio.currentTime = newTime
  }

  togglePlay = () => {
    if (this.audio.paused) {
      this.audio.play()
    } else {
      this.audio.pause()
    }
  }

  render(
    { audioUrl, playNext, onPause, onPlay, onLoadStart, online },
    { playing }
  ) {
    return (
      <Wrapper online={online} visible={audioUrl !== null}>
        <PlayerControls toggle={this.togglePlay} />

        {audioUrl && <Slider onChange={this.changeTime} />}

        <audio
          crossOrigin="anonymous"
          onTimeUpdate={throttle(this.onTimeUpdate, 1000, { leading: false })}
          onLoadedMetadata={this.onLoadedMetadata}
          onLoadStart={onLoadStart}
          onEnded={playNext}
          onPause={onPause}
          onPlay={onPlay}
          src={audioUrl}
          ref={e => (this.audio = e)}
        />
      </Wrapper>
    )
  }
}

const state = ({ playlist, root }) => ({
  audioUrl: playlist.audioUrl,
  online: root.online
})

const actions = {
  onPlay: on_play,
  onPause: on_pause,
  playNext: play_next,
  changeTime: change_time,
  onLoadStart: on_load_start,
  changeDuration: change_duration
}

export default connect(state, actions)(Player)