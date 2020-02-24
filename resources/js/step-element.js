class StepElement extends Step {
    constructor(element, percentage, color) {
        super(percentage, color);

        this.element = document.createElement("div");
        this.element.className = "gradient-step";
        element.appendChild(this.element);
    }
}
