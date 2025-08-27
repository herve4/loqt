document.querySelectorAll(".zoom-click").forEach(img => {
  img.addEventListener("click", function () {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const modalDetails = document.getElementById("modalDetails");

    if (this.dataset.images) {
      // Set up Swiper for interactive slider
      const swiperWrapper = document.createElement('div');
      swiperWrapper.classList.add('swiper-wrapper');

      this.dataset.images.split(',').forEach(imageSrc => {
        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');
        const image = document.createElement('img');
        image.src = imageSrc;
        slide.appendChild(image);
        swiperWrapper.appendChild(slide);
      });

      modalImg.innerHTML = '';
      modalImg.appendChild(swiperWrapper);

      new Swiper(modalImg, {
        loop: true,
        effect: 'fade',
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
        },
      });
    }

    modalDetails.innerHTML = `
      <h3>${this.dataset.nom}</h3>
      <p><strong>Catégorie :</strong> ${this.dataset.categorie}</p>
      <p><strong>Quantité :</strong> ${this.dataset.quantite}</p>
    `;
    modal.style.display = "block";
  });
});

document.querySelector(".close-modal").addEventListener("click", function () {
  document.getElementById("imageModal").style.display = "none";
});
window.addEventListener("click", function (e) {
  const modal = document.getElementById("imageModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});


