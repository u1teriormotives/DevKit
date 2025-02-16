import { Element } from "./Element";

export default class Text {
    public readonly assignedSlot: Element | null = null;
    private textContent: string;

    constructor(text: string) {
        this.textContent = text;
    }

    get wholeText(): string {
        return this.textContent;
    }

    get text(): string {
        return this.textContent;
    }

    public splitText(offset: number): Text {
        if (offset < 0 || offset > this.textContent.length)
            throw new Error("IndexSizeError: The offset is out of range.");

        const before = this.textContent.slice(0, offset);
        const after = this.textContent.slice(offset);

        this.textContent = before;

        return new Text(after);
    }
}
