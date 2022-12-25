// handles all display elements
class View {
    constructor(model) {
        this.model = model;
        this.mouseDown = false;
        this.gridSize = 8;
    }

    initializeDisplay() {
        this.renderGrid();
    }

    mouseIsDown(e) {
        this.mouseDown = true;
        this.activateBlock(e);
    }

    mouseIsUp() {
        this.mouseDown = false;
    }

    conditionallyActivate(e) {
        if (this.mouseDown) {
            this.activateBlock(e);
        }
    }

    activateBlock(e) {
        e.target.classList.add("grid-activated");
        const currentTier = this.getTier(e);
        const prevTier = this.model.getTier(e.target.id);
        if (currentTier > prevTier) {
            this.model.changeBlockTier(e.target.id, currentTier);
            e.target.style.opacity = currentTier / 16;
        }
    }

    // gets the tier of a block based on mouse position relative to the block's center
    // the closer to the center of the block the mouse is, the darker the block will be
    // which translates to a higher (more white) pixel number
    getTier(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const middle = e.target.offsetWidth / 2;
        const distance = this.getDistance(x, y, middle, middle);
        const maxDistance = this.getDistance(0, 0, middle, middle);
        const tier = 16 - Math.floor(distance / maxDistance * 16);

        return Math.min(16, tier+4);
    }

    getDistance(x, y, middleX, middleY) {
         return Math.sqrt( Math.pow(middleX - x, 2) + Math.pow(middleY - y, 2) );
    }

    // renders grid onto the canvas
    renderGrid() {
        this.model.setBlockTiers(this.gridSize);
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                let square = document.createElement("div");
                square.className = "grid-item row" + i + " col" + j;
                square.id = i + "-" + j;
                this.setBlockHandlers(square);
                this.getElement("canvas").appendChild(square);
            }
        }
    }

    // sets event handlers for a given grid spot
    setBlockHandlers(block) {
        block.addEventListener("mousedown", this.mouseIsDown.bind(this));
        block.addEventListener("mouseup", this.mouseIsUp.bind(this));
        block.addEventListener("mousemove", this.conditionallyActivate.bind(this));
    }

    getElement(id) {
        return document.getElementById(id);
    }

    showPrediction(prediction) {
        this.getElement("prediction").innerHTML = prediction;
    }

    reset() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                this.getElement(i + "-" + j).classList.remove("grid-activated");
                this.getElement(i + "-" + j).style.opacity = "1";
            }
        }
        this.model.resetTiers(this.gridSize);
        this.showPrediction("__")
    }

}

class Model {
    constructor() {
        this.blockTiers = {};
    }

    setBlockTiers(gridSize) {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                this.blockTiers[i + "-" + j] = 0;
            }
        }
    }

    resetTiers(gridSize) {
        this.blockTiers = {};
        this.setBlockTiers(gridSize);
    }

    getTier(id) {
        return this.blockTiers[id];
    }

    changeBlockTier(id, tier) {
        this.blockTiers[id] = tier;
    }

    getPixels(gridSize) {
        let pixels = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                pixels.push(this.blockTiers[i + "-" + j]);
            }
        }
        return pixels;
    }
}

class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    start() {
        this.view.initializeDisplay();
        this.setButtonHandlers();
    }

    setButtonHandlers() {
        view.getElement("predict").addEventListener("click", this.predict.bind(this));
        view.getElement("reset").addEventListener("click", this.view.reset.bind(this.view))
    }

    predict() {
        const pixels = this.model.getPixels(this.view.gridSize);
        fetch("/predict", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(pixels)})
            .then(res => res.json())
            .then(data => { this.view.showPrediction(data.prediction) });
    }
}

const model = new Model();
const view = new View(model);
const controller = new Controller(model, view);