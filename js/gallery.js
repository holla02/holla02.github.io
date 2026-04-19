import { db } from './firebase-config.js';
import { ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

let _galleryId = getGalleryId();
let _visitorId = localStorage.getItem('visitorId');

function getGalleryId() {
  const path = window.location.pathname;
  const match = path.match(/^(?:\/([a-z]{2,3}))?\/gallery\/([a-zA-Z0-9_-]+)\/$/);
  if (!match) return '';

  const galleryId = '__gallery__' + match[2];
  return galleryId;
}

function recordGalleryView() {
  const galleryVisitorRef = ref(db, `gallery/${_galleryId}/visitors/${_visitorId}`);
  get(galleryVisitorRef).then((snapshot) => {
    if (!snapshot.exists()) {
      // not visited, record and increment view count
      set(galleryVisitorRef, {
        timestamp: Date.now()
      }).then(() => {
        const viewCountRef = ref(db, `gallery/${_galleryId}/viewcount`);
        get(viewCountRef).then((countSnapshot) => {
          const currentCount = countSnapshot.exists() ? countSnapshot.val() : 0;
          set(viewCountRef, currentCount + 1).catch(error => {
            console.error('Failed to increment gallery view count:', error);
          });
        }).catch(error => {
          console.error('Failed to fetch gallery view count:', error);
        });
      }).catch(error => {
        console.error('Failed to record gallery view:', error);
      });
    } else {
      // visited, only update timestamp
      set(galleryVisitorRef, {
        timestamp: Date.now()
      }).catch(error => {
        console.error('Failed to update gallery timestamp:', error);
      });
    }
  }).catch(error => {
    console.error('Failed to check gallery visitor:', error);
  });
}

if (_galleryId.length > 0) {
  let viewsElement = document.getElementById('gallery-view-count');
  if (viewsElement) {
    const galleryViewRef = ref(db, `gallery/${_galleryId}/viewcount`);
    onValue(galleryViewRef, (snapshot) => {
      const viewCount = snapshot.exists() ? snapshot.val() : 0;
      document.getElementById('gallery-view-count').textContent = viewCount;
    }, (error) => {
      console.error('Failed to fetch gallery view count:', error);
      document.getElementById('gallery-view-count').textContent = '錯誤';
    });

    console.log('Recording gallery view for visitor:', _visitorId);
    recordGalleryView();
  } else {
    console.log('Gallery view count element not found');
  }
} else {
  console.log('No valid gallery ID found in URL');
}
