const itemsData = [
    {
        id: 263,
        name: "Clear Rune",
        quality: 2,
        type: "Active",
        description: "Rune mimic - copies the effect of the Rune or Soul stone you are holding",
        pool: "Secret Room",
        image: "img/items/263.webp"
    },
    {
        id: 553,
        name: "Mucormycosis",
        quality: 3,
        type: "Passive",
        description: "Spore shot - Tears have a chance to fire fungus tears that stick to enemies",
        pool: "Item Room",
        image: "img/items/553.webp"
    },
    {
        id: 554,
        name: "2Spooky",
        quality: 1,
        type: "Passive",
        description: "4me - Enemies within close range become feared and flee",
        pool: "Devil Room",
        image: "img/items/554.webp"
    },
    {
        id: 555,
        name: "Golden Razor",
        quality: 1,
        type: "Active",
        description: "Pain from gain - Takes coins and grants damage ups",
        pool: "Item Room",
        image: "img/items/555.webp"
    },
    {
        id: 556,
        name: "Sulfur",
        quality: 2,
        type: "Active",
        description: "Temporary demon form - Grants Brimstone for current room",
        pool: "Devil Room",
        image: "img/items/556.webp"
    },
    {
        id: 557,
        name: "Fortune Cookie",
        quality: 2,
        type: "Active",
        description: "Reusable fortunes - Displays random fortune and drops rewards",
        pool: "Item Room",
        image: "img/items/557.webp"
    },
    {
        id: 558,
        name: "Eye Sore",
        quality: 1,
        type: "Passive",
        description: "More eyes - Chance to fire extra tears in random directions",
        pool: "Item Room",
        image: "img/items/558.webp"
    },
    {
        id: 559,
        name: "120 Volt",
        quality: 2,
        type: "Passive",
        description: "Zap! - Fires electricity at nearby enemies with chain effect",
        pool: "Item Room",
        image: "img/items/559.webp"
    },
    {
        id: 560,
        name: "It Hurts",
        quality: 1,
        type: "Passive",
        description: "Taking damage fires tears and grants tears up",
        pool: "Item Room",
        image: "img/items/560.webp"
    },
    {
        id: 561,
        name: "Almond Milk",
        quality: 1,
        type: "Passive",
        description: "DMG down + tears up - Tears gain random worm effects",
        pool: "Item Room",
        image: "img/items/561.png"
    },
    {
        id: 562,
        name: "Rock Bottom",
        quality: 3,
        type: "Passive",
        description: "It's only up from there - Prevents stat reductions for rest of run",
        pool: "Secret Room",
        image: "img/items/562.webp"
    },
    {
        id: 563,
        name: "Nancy Bombs",
        quality: 2,
        type: "Passive",
        description: "Random blast - Bombs explode with random effects",
        pool: "Item Room",
        image: "img/items/563.webp"
    }
];

const sortSelect = document.getElementById('sort');
const filterSelect = document.getElementById('filter');
const sizeSelect = document.getElementById('size');
const itemsGrid = document.getElementById('itemsGrid');

function createItemCard(item) {
    return `
        <div class="item-card">
            <div class="item-image">
                ${item.image
                    ? `<img src="${item.image}" class="item-image-img">`
                    : `<div class="image-placeholder">${item.id}</div>`}
            </div>
            <div class="item-info">
                <h4>${item.name}</h4>
                <p class="item-id">ID: ${item.id}</p>
                <p class="item-quality">Quality: ${item.quality}</p>
                <p class="item-type">Type: ${item.type}</p>
                <p class="item-description">${item.description}</p>
                <p class="item-pool">Pool: ${item.pool}</p>
            </div>
        </div>
    `;
}

function renderItems(items) {
    itemsGrid.innerHTML = items.map(createItemCard).join('');
}

function sortItems(items, sortBy) {
    const sorted = [...items];
    switch (sortBy) {
        case 'Name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'Quality':
            sorted.sort((a, b) => b.quality - a.quality);
            break;
        case 'Item ID':
        default:
            sorted.sort((a, b) => a.id - b.id);
    }
    return sorted;
}

function filterItems(items, filterBy) {
    switch (filterBy) {
        case 'Active Items':
            return items.filter(item => item.type === 'Active');
        case 'Passive Items':
            return items.filter(item => item.type === 'Passive');
        case 'All Items':
        default:
            return items;
    }
}

function updateDisplay() {
    let filtered = filterItems(itemsData, filterSelect.value);
    let sorted = sortItems(filtered, sortSelect.value);
    renderItems(sorted);
}

function updateGridSize(size) {
    const root = document.documentElement;
    switch (size) {
        case 'Smaller':
            root.style.setProperty('--grid-min-size', '200px');
            break;
        case 'Larger':
            root.style.setProperty('--grid-min-size', '500px');
            break;
        case 'Default':
        default:
            root.style.setProperty('--grid-min-size', '280px');
    }
}

sortSelect.addEventListener('change', updateDisplay);
filterSelect.addEventListener('change', updateDisplay);
sizeSelect.addEventListener('change', () => updateGridSize(sizeSelect.value));

document.documentElement.style.setProperty('--grid-min-size', '280px');

renderItems(itemsData);
