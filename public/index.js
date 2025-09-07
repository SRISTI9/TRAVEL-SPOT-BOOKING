let next = document.querySelector('.next');
let prev = document.querySelector('.prev');

// Handle next image slide
function Next() {
    let items = document.querySelectorAll('.item');
    document.querySelector('.slide').appendChild(items[0]);
}

// Handle previous image slide
function Prev() {
    let items = document.querySelectorAll('.item');
    document.querySelector('.slide').prepend(items[items.length - 1]);
}

// Add event listeners for navigation buttons
next.addEventListener('click', Next);
prev.addEventListener('click', Prev);

// Add keyboard event listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        Next();
    } else if (e.key === 'ArrowLeft') {
        Prev();
    }
});

// Handle "Read more" button clicks for descriptions
document.querySelectorAll(".read-more").forEach((button) => {
    button.addEventListener("click", () => {
        const descriptionBox = button.previousElementSibling;
        const isVisible = descriptionBox.textContent.trim() !== "";

        if (isVisible) {
            descriptionBox.textContent = "";
            button.textContent = "Read more";
        } else {
            const desc = button.getAttribute("data-description");
            descriptionBox.textContent = desc;
            button.textContent = "Show less";
        }
    });
});
