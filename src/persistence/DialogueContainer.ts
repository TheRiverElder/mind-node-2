import { ReactNode } from "react";

export interface DialogueContainer {
    createDialogue(element: ReactNode): void;
    closeDialogue(): void;
}