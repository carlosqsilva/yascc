import * as type from "./constants"

import { api_key_dev } from "./api_keys"
import { truncateString, msToTime } from "./utils"

const api_tracks = `https://api.soundcloud.com/tracks?linked_partitioning=1&limit=35&offset=0&${api_key_dev}`

const filter_data = data => {
  let newData = data.collection
    .filter(track => track.artwork_url !== null && track.duration !== 30000)
    .map(track => {
      return {
        title: truncateString(track.title),
        duration: msToTime(track.duration),
        stream: track.stream_url,
        artwork: track.artwork_url,
        user: track.user.username,
        id: track.id,
        likes: track.likes_count
      }
    })

  return { playlist: newData, nextUrl: data.next_href }
}

export const toggle_sidebar = () => ({
  type: type.TOGGLE_SIDEBAR
})

export const on_play = () => ({
  type: type.ON_PLAY
})

export const on_pause = () => ({
  type: type.ON_PAUSE
})

export const play_song = (songIndex, song) => dispatch => {
  const audioUrl = `${song.stream}?${api_key_dev}`

  dispatch({ type: type.PLAY_SONG, songIndex, song, audioUrl })
}

export const play_song_from_btn = (index, route) => (dispatch, getState) => {
  let location = getState().playlist.location
  let playlist

  if (location !== route) {
    switch (route) {
      case "/":
        playlist = getState().root.playlist
        break
      case "/search":
        playlist = getState().search.results
        break
      case "/playlist":
        playlist = getState().userPlaylist.playlist
        break
      default:
        return []
    }
    dispatch({
      type: type.ACTIVE_PLAYLIST,
      currentPlaylist: playlist,
      location: route
    })
  } else {
    playlist = getState().playlist.playlist
  }

  dispatch(play_song(index, playlist[index]))
}

export const play_next = () => (dispatch, getState) => {
  const { playlist, songIndex } = getState().playlist
  const nextSong = songIndex !== playlist.length - 1 ? songIndex + 1 : 0
  dispatch(play_song(nextSong, playlist[nextSong]))
}

export const play_prev = () => (dispatch, getState) => {
  const { playlist, songIndex } = getState().playlist
  const prevSong = songIndex !== 0 ? songIndex - 1 : playlist.length - 1
  dispatch(play_song(prevSong, playlist[prevSong]))
}

const fetch_songs = (url, action) => dispatch => {
  fetch(url)
    .then(resp => resp.json())
    .then(data => filter_data(data))
    .then(({ playlist, nextUrl }) =>
      dispatch({ type: action, playlist, nextUrl })
    )
}

export const load_playlist = (genre = "house") => dispatch => {
  const url = `${api_tracks}&genres=${genre}`

  dispatch({ type: type.PLAYLIST_LOADING })
  dispatch(fetch_songs(url, type.PLAYLIST_LOADED))
}

export const load_playlist_next = () => (dispatch, getState) => {
  const { nextUrl, loadingPlaylist } = getState().root

  if (!loadingPlaylist) {
    dispatch({ type: type.PLAYLIST_LOADING_NEXT })
    dispatch(fetch_songs(nextUrl, type.PLAYLIST_LOADED))
  }
}

export const search_songs = q => dispatch => {
  const query = q
    .trim()
    .split(" ")
    .filter(str => str.length > 0)
    .join("%20")
  const url = `${api_tracks}&q=${query}`
  dispatch({ type: type.LOADING_SEARCH })
  dispatch(fetch_songs(url, type.LOADED_SEARCH))
}

export const load_next_results = () => (dispatch, getState) => {
  const { nextUrl, loadingSearch } = getState().search

  if (!loadingSearch) {
    dispatch({ type: type.LOADING_SEARCH_NEXT })
    dispatch(fetch_songs(nextUrl, type.LOADED_SEARCH))
  }
}

export const add_to_playlist = song => (dispatch, getState) => {
  const playlist = getState().userPlaylist.playlist
  const repeated = playlist.filter(track => track.id === song.id)
  if (repeated.length === 0) {
    dispatch({ type: type.ADD_TO_PLAYLIST, song })
  }
}

export const remove_from_playlist = song => (dispatch, getState) => {
  let playlist = getState().userPlaylist.playlist.filter(
    track => track.id !== song.id
  )
  dispatch({ type: type.REMOVE_FROM_PLAYLIST, playlist })
}

// export const import_playlist = (url) => (dispatch) => {
//   const apiCall = `http://api.soundcloud.com/resolve?url=${url}&${api_key_dev}`
// }