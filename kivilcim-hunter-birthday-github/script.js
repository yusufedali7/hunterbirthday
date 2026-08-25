const startButton = document.querySelector('#start-journey');
const missionButtons = [...document.querySelectorAll('.mission-button')];
const progressFill = document.querySelector('#progress-fill');
const progressText = document.querySelector('#progress-text');
const openLetter = document.querySelector('#open-letter');
const lockStatus = document.querySelector('#lock-status');
const finale = document.querySelector('.finale');
const letter = document.querySelector('#letter');
const completed = new Set();

let scrollAnimationFrame = null;
let scrollCancelled = false;

function cancelSmoothScroll() {
  scrollCancelled = true;
  if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame);
}

function smoothScrollTo(target, duration = 1250) {
  if (!target) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    target.scrollIntoView();
    return;
  }

  const start = window.scrollY;
  const destination = target.getBoundingClientRect().top + window.scrollY;
  const distance = destination - start;
  const startedAt = performance.now();
  scrollCancelled = false;

  function step(now) {
    if (scrollCancelled) return;
    const elapsed = Math.min((now - startedAt) / duration, 1);
    const eased = elapsed < 0.5
      ? 4 * elapsed * elapsed * elapsed
      : 1 - Math.pow(-2 * elapsed + 2, 3) / 2;
    window.scrollTo(0, start + distance * eased);
    if (elapsed < 1) scrollAnimationFrame = requestAnimationFrame(step);
  }

  scrollAnimationFrame = requestAnimationFrame(step);
}

window.addEventListener('wheel', cancelSmoothScroll, { passive: true });
window.addEventListener('touchstart', cancelSmoothScroll, { passive: true });
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelSmoothScroll();
});

startButton?.addEventListener('click', () => {
  smoothScrollTo(document.querySelector('#macera'));
});

missionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.mission-card');
    const id = card?.dataset.mission;
    if (!card || !id) return;

    card.classList.add('is-complete');
    card.querySelector('.mission-secret')?.setAttribute('aria-hidden', 'false');
    button.querySelector('span:first-child').textContent = 'GÖREV TAMAMLANDI';
    button.querySelector('span:last-child').textContent = '✓';
    button.disabled = true;
    completed.add(id);

    const count = completed.size;
    progressFill.style.width = `${(count / 3) * 100}%`;
    progressText.textContent = `${count} / 3`;

    if (count === 3) {
      openLetter.disabled = false;
      lockStatus.textContent = 'Aura tamamlandı. Son mesaj seni bekliyor.';
    }
  });
});

openLetter?.addEventListener('click', () => {
  finale?.classList.add('letter-open');
  letter?.setAttribute('aria-hidden', 'false');
  celebrate();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));

const gallery = [...document.querySelectorAll('.photo-card')].map((card) => ({
  src: card.querySelector('img').src,
  alt: card.querySelector('img').alt,
  caption: card.querySelector('span').textContent.trim()
}));
const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxCaption = lightbox?.querySelector('p');
let activePhoto = 0;

function showPhoto(index) {
  activePhoto = (index + gallery.length) % gallery.length;
  const photo = gallery[activePhoto];
  if (!photo || !lightboxImage || !lightboxCaption) return;
  lightboxImage.src = photo.src;
  lightboxImage.alt = photo.alt;
  lightboxCaption.textContent = photo.caption;
}

document.querySelectorAll('.photo-card').forEach((card, index) => {
  card.addEventListener('click', () => {
    showPhoto(index);
    lightbox?.showModal();
  });
});
lightbox?.querySelector('.lightbox__close')?.addEventListener('click', () => lightbox.close());
lightbox?.querySelector('.lightbox__nav--prev')?.addEventListener('click', () => showPhoto(activePhoto - 1));
lightbox?.querySelector('.lightbox__nav--next')?.addEventListener('click', () => showPhoto(activePhoto + 1));
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
document.addEventListener('keydown', (event) => {
  if (!lightbox?.open) return;
  if (event.key === 'ArrowLeft') showPhoto(activePhoto - 1);
  if (event.key === 'ArrowRight') showPhoto(activePhoto + 1);
});

function celebrate() {
  const colors = ['#c8e23e', '#f2483e', '#f2eedf', '#3da89b'];
  for (let i = 0; i < 64; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 240}px`);
    piece.style.setProperty('--duration', `${2.4 + Math.random() * 2.5}s`);
    piece.style.animationDelay = `${Math.random() * 0.55}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 5600);
  }
}

const downloadLicenseButton = document.querySelector('#download-license');
const licenseCanvas = document.querySelector('#license-canvas');
const downloadStatus = document.querySelector('#download-status');

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function drawCover(context, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = Math.max(0, (image.naturalHeight - sourceHeight) * 0.58);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawBarcode(context, x, y, width, height) {
  context.fillStyle = '#ffffff';
  context.fillRect(x, y, width, height);
  const widths = [5, 11, 4, 7, 15, 5, 9, 4, 18, 6, 4, 12];
  let cursor = x + 12;
  let index = 0;
  context.fillStyle = '#050505';
  while (cursor < x + width - 12) {
    const barWidth = widths[index % widths.length];
    context.fillRect(cursor, y + 10, barWidth, height - 20);
    cursor += barWidth + widths[(index + 3) % widths.length];
    index += 1;
  }
}

function drawLicenseEmblem(context, centerX, centerY) {
  context.save();
  context.translate(centerX, centerY);
  context.strokeStyle = '#050505';
  context.lineWidth = 28;
  context.beginPath();
  context.moveTo(-95, -100);
  context.lineTo(0, 100);
  context.lineTo(95, -100);
  context.stroke();
  context.fillStyle = '#c40055';
  context.rotate(Math.PI / 4);
  context.fillRect(-38, -38, 76, 76);
  context.restore();
}

downloadLicenseButton?.addEventListener('click', async () => {
  if (!licenseCanvas || !downloadStatus) return;
  downloadLicenseButton.disabled = true;
  downloadStatus.textContent = 'Lisans hazırlanıyor…';

  try {
    const portrait = await loadImage('assets/photos/memory-01.webp');
    const context = licenseCanvas.getContext('2d');
    const width = licenseCanvas.width;
    const height = licenseCanvas.height;

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#050505';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#f7f5f2';
    context.fillRect(34, 34, width - 68, height - 68);
    context.fillStyle = '#acd8f7';
    context.fillRect(62, 62, width - 124, height - 124);

    context.fillStyle = '#050505';
    context.fillRect(62, 62, width - 124, 116);
    context.fillStyle = '#ffffff';
    context.font = '900 50px Arial';
    context.fillText('HUNTER LICENSE', 96, 137);
    context.font = '800 27px Courier New';
    context.textAlign = 'right';
    context.fillText('KV-0825-1039  //  ACCESS ∞', width - 96, 132);
    context.textAlign = 'left';

    context.fillStyle = '#c40055';
    context.fillRect(82, 198, 406, 416);
    drawCover(context, portrait, 96, 212, 378, 388);
    context.strokeStyle = '#050505';
    context.lineWidth = 10;
    context.strokeRect(96, 212, 378, 388);

    drawLicenseEmblem(context, 610, 343);
    context.fillStyle = '#050505';
    context.font = '800 22px Courier New';
    context.fillText('LİSANS SAHİBİ', 738, 250);
    context.font = '900 86px Arial';
    context.fillText('KIVILCIM', 732, 336);
    context.fillStyle = '#c40055';
    context.fillRect(738, 364, 470, 50);
    context.fillStyle = '#ffffff';
    context.font = '800 24px Courier New';
    context.fillText('SPECIALIST HUNTER', 758, 397);

    context.fillStyle = '#050505';
    context.font = '800 22px Courier New';
    context.fillText('NEN YETENEĞİ', 738, 462);
    context.font = '900 42px Arial';
    context.fillText('MIRMIR KÖPÜĞÜ', 738, 510);
    context.font = '800 21px Courier New';
    context.fillText('SINIF: SPECIALIST', 738, 560);
    context.fillText('YETKİ: ★★★★★', 1020, 560);
    context.fillText('DURUM: AKTİF', 738, 602);

    drawBarcode(context, 82, 650, width - 164, 112);
    context.fillStyle = '#050505';
    context.font = '800 20px Courier New';
    context.fillText('ハンター × ハンター  //  ISSUED 25·08·2026', 94, 804);
    context.textAlign = 'right';
    context.fillText('AUTHORIZATION: YUSUF', width - 94, 804);
    context.textAlign = 'left';

    const blob = await new Promise((resolve) => licenseCanvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG oluşturulamadı.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kivilcim-hunter-license.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    downloadStatus.textContent = 'Lisans indirildi. Artık resmen bir Hunter’sın!';
  } catch (error) {
    console.error(error);
    downloadStatus.textContent = 'Lisans hazırlanamadı. Lütfen tekrar dene.';
  } finally {
    downloadLicenseButton.disabled = false;
  }
});

const themeMusic = document.querySelector('#theme-music');
const musicToggle = document.querySelector('#music-toggle');
const musicIcon = document.querySelector('#music-icon');
const musicState = document.querySelector('#music-state');
const musicProgress = document.querySelector('#music-progress');
const musicTime = document.querySelector('#music-time');

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function updateMusicUI(isPlaying) {
  if (!musicToggle || !musicIcon || !musicState) return;
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.setAttribute('aria-label', isPlaying ? 'Müziği duraklat' : 'Müziği başlat');
  musicIcon.textContent = isPlaying ? 'Ⅱ' : '▶';
  musicState.textContent = isPlaying ? 'ŞİMDİ ÇALIYOR' : 'MÜZİĞİ BAŞLAT';
}

musicToggle?.addEventListener('click', async () => {
  if (!themeMusic) return;
  if (themeMusic.paused) {
    try {
      await themeMusic.play();
      updateMusicUI(true);
    } catch (error) {
      console.error(error);
      musicState.textContent = 'OYNATILAMADI';
    }
  } else {
    themeMusic.pause();
    updateMusicUI(false);
  }
});

themeMusic?.addEventListener('timeupdate', () => {
  const ratio = themeMusic.duration ? themeMusic.currentTime / themeMusic.duration : 0;
  if (musicProgress) musicProgress.style.width = `${Math.min(ratio * 100, 100)}%`;
  if (musicTime) musicTime.textContent = formatTime(themeMusic.currentTime);
});
themeMusic?.addEventListener('ended', () => updateMusicUI(false));
themeMusic?.addEventListener('error', () => {
  if (musicState) musicState.textContent = 'MÜZİK BULUNAMADI';
});
