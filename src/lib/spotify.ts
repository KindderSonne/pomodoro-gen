
// This is a mock implementation of Spotify API integration
// In a real application, you would integrate with the actual Spotify Web API

import { SpotifyTrack } from '@/types';

// Mock data
const popularTracks: SpotifyTrack[] = [
  {
    id: '1',
    name: 'Lo-fi Hip Hop',
    artist: 'ChillHop Music',
    albumArt: 'https://i.scdn.co/image/ab67616d00001e02c5649add07ed3720be9d5526',
    uri: 'spotify:track:1',
  },
  {
    id: '2',
    name: 'Deep Focus',
    artist: 'Spotify',
    albumArt: 'https://i.scdn.co/image/ab67616d00001e02b52a59c4b2c89aea4129b6d9',
    uri: 'spotify:track:2',
  },
  {
    id: '3',
    name: 'Peaceful Piano',
    artist: 'Spotify',
    albumArt: 'https://i.scdn.co/image/ab67706f00000002ca5a7517156021292e5663a6',
    uri: 'spotify:track:3',
  },
  {
    id: '4',
    name: 'Jazz Vibes',
    artist: 'Spotify',
    albumArt: 'https://i.scdn.co/image/ab67706f000000025f0ff9251e3cfe641160dc31',
    uri: 'spotify:track:4',
  },
  {
    id: '5',
    name: 'Electronic Focus',
    artist: 'Spotify',
    albumArt: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc',
    uri: 'spotify:track:5',
  },
];

let isPlaying = false;
let currentVolume = 80;
let currentTrackIndex = 0;

export const spotifyApi = {
  isAuthenticated: false,
  
  login: async () => {
    // In a real app, this would redirect to Spotify OAuth
    console.log('Logging in to Spotify...');
    // Mock successful login after 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    spotifyApi.isAuthenticated = true;
    return true;
  },
  
  logout: () => {
    spotifyApi.isAuthenticated = false;
    isPlaying = false;
  },
  
  getRecommendedTracks: async (): Promise<SpotifyTrack[]> => {
    // In a real app, this would call the Spotify API
    await new Promise(resolve => setTimeout(resolve, 800));
    return popularTracks;
  },
  
  getCurrentTrack: (): SpotifyTrack => {
    return popularTracks[currentTrackIndex];
  },
  
  play: () => {
    isPlaying = true;
    console.log('Playing:', popularTracks[currentTrackIndex].name);
    return isPlaying;
  },
  
  pause: () => {
    isPlaying = false;
    console.log('Paused:', popularTracks[currentTrackIndex].name);
    return isPlaying;
  },
  
  isPlaying: () => {
    return isPlaying;
  },
  
  nextTrack: () => {
    currentTrackIndex = (currentTrackIndex + 1) % popularTracks.length;
    console.log('Next track:', popularTracks[currentTrackIndex].name);
    return popularTracks[currentTrackIndex];
  },
  
  previousTrack: () => {
    currentTrackIndex = currentTrackIndex === 0 
      ? popularTracks.length - 1 
      : currentTrackIndex - 1;
    console.log('Previous track:', popularTracks[currentTrackIndex].name);
    return popularTracks[currentTrackIndex];
  },
  
  setVolume: (volume: number) => {
    currentVolume = volume;
    console.log('Volume set to:', volume);
    return currentVolume;
  },
  
  getVolume: () => {
    return currentVolume;
  },
};
