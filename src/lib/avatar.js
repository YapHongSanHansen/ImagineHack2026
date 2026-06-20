// Person photos for graph nodes + avatars.
// Default: a unique, deterministic headshot per employee id (pravatar) so every
// person looks different. Override any individual in PHOTOS with a local image
// dropped into public/avatars/ (e.g. e13: '/avatars/maya.jpg').
export const PHOTOS = {
  // e01: '/avatars/imagesd.jpg',   // pin a local photo to a specific person
  // e13: '/avatars/maya.jpg',
};

// unique real-person headshot per id; ?u= makes it stable per person
export const avatarUrl = (id) => PHOTOS[id] || `https://i.pravatar.cc/200?u=draftboard-${id}`;
