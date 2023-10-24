import { type Metadata } from "next";

import { DraggableExample } from "./_draggable";

export const metadata: Metadata = {
	title: "Draggable | TKIT",
};

function DraggablePage() {
	return <DraggableExample />;
}

export default DraggablePage;
