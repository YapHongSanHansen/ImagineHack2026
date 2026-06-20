// Person photos for graph nodes + avatars.
// Default photo is used for everyone; add per-id overrides to PHOTOS to give
// individuals their own headshot (e.g. e13: '/avatars/maya.jpg').
const DEFAULT_PHOTO = '/avatars/imagesd.jpg';

export const PHOTOS = {
  // e01: '/avatars/ravi.jpg',
  // e13: '/avatars/maya.jpg',
};

export const avatarUrl = (id) => PHOTOS[id] || DEFAULT_PHOTO;
