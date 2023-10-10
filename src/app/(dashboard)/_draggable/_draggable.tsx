"use client";

import * as React from "react";
import {
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useDraggable,
	useSensor,
	useSensors,
	type DraggableSyntheticListeners,
	type Modifiers,
	type PointerActivationConstraint,
} from "@dnd-kit/core";
import { createSnapModifier } from "@dnd-kit/modifiers";
import type { Coordinates, Transform } from "@dnd-kit/utilities";

import { cn } from "~/lib/utils";

export function DraggableExample() {
	return <SnapToGrid />;
}

const SnapToGrid = () => {
	const [gridSize] = React.useState(40);
	const style = {
		alignItems: "flex-start",
	};

	const snapToGrid = React.useMemo(() => createSnapModifier(gridSize), [gridSize]);

	return (
		<>
			<DraggableStory
				label={`Snapping to ${gridSize}px increments`}
				modifiers={[snapToGrid]}
				style={style}
				key={gridSize}
			/>
			{/* <Grid size={gridSize} onSizeChange={setGridSize} /> */}
		</>
	);
};

// interface GridProps {
// 	size: number;
// 	step?: number;
// 	onSizeChange(size: number): void;
// }

// function Grid({ size }: GridProps) {
// 	return (
// 		<div
// 			className="pointer-events-none absolute inset-x-0 -z-10 h-full w-full"
// 			style={
// 				{
// 					"--grid-size": `${size}px`,
// 					backgroundImage: `repeating-linear-gradient(
// 						0deg,
// 						transparent,
// 						transparent calc(var(--grid-size) - 1px),
// 						#ddd calc(var(--grid-size) - 1px),
// 						#ddd var(--grid-size)
// 					  ),
// 					  repeating-linear-gradient(
// 						-90deg,
// 						transparent,
// 						transparent calc(var(--grid-size) - 1px),
// 						#ddd calc(var(--grid-size) - 1px),
// 						#ddd var(--grid-size)
// 					  )`,
// 					backgroundSize: `var(--grid-size) var(--grid-size)`,
// 				} as React.CSSProperties
// 			}
// 		/>
// 	);
// }

enum Axis {
	All,
	Vertical,
	Horizontal,
}

interface Props {
	activationConstraint?: PointerActivationConstraint;
	axis?: Axis;
	handle?: boolean;
	modifiers?: Modifiers;
	buttonStyle?: React.CSSProperties;
	style?: React.CSSProperties;
	label?: string;
}

const defaultCoordinates = {
	x: 0,
	y: 0,
} as const;

function DraggableStory({
	activationConstraint,
	axis,
	handle,
	label = "Go ahead, drag me.",
	modifiers,
	style,
	buttonStyle,
}: Props) {
	const [{ x, y }, setCoordinates] = React.useState<Coordinates>(defaultCoordinates);
	const mouseSensor = useSensor(MouseSensor, {
		activationConstraint,
	});
	const touchSensor = useSensor(TouchSensor, {
		activationConstraint,
	});
	const keyboardSensor = useSensor(KeyboardSensor, {});
	const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

	return (
		<DndContext
			sensors={sensors}
			onDragEnd={({ delta }) => {
				setCoordinates(({ x, y }) => {
					return {
						x: x + delta.x,
						y: y + delta.y,
					};
				});
			}}
			modifiers={modifiers}
		>
			<div className="flex w-full justify-start p-5">
				<DraggableItem
					axis={axis}
					label={label}
					handle={handle}
					top={y}
					left={x}
					style={style}
					buttonStyle={buttonStyle}
				/>
			</div>
		</DndContext>
	);
}

interface DraggableItemProps {
	label: string;
	handle?: boolean;
	style?: React.CSSProperties;
	buttonStyle?: React.CSSProperties;
	axis?: Axis;
	top?: number;
	left?: number;
}

function DraggableItem({ axis, label, style, top, left, handle, buttonStyle }: DraggableItemProps) {
	const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
		id: "draggable",
	});

	return (
		<Draggable
			ref={setNodeRef}
			dragging={isDragging}
			handle={handle}
			label={label}
			listeners={listeners}
			style={{ ...style, top, left }}
			buttonStyle={buttonStyle}
			transform={transform}
			axis={axis}
			{...attributes}
		/>
	);
}

interface Props {
	label?: string;
	dragging?: boolean;
	listeners?: DraggableSyntheticListeners;
	style?: React.CSSProperties;
	buttonStyle?: React.CSSProperties;
	transform?: Transform | null;
}

export const Draggable = React.forwardRef<HTMLButtonElement, Props>(function Draggable(
	{ dragging, handle, label, listeners, transform, style, buttonStyle, ...props },
	ref,
) {
	return (
		<div
			className={cn(
				"relative flex items-center flex-col justify-center transition",
				dragging && "opacity-75 scale-105 z-10 transition-none",
			)}
			style={
				{
					...style,
					"--translate-x": `${transform?.x ?? 0}px`,
					"--translate-y": `${transform?.y ?? 0}px`,
				} as React.CSSProperties
			}
		>
			<button
				{...props}
				aria-label="Draggable"
				data-cypress="draggable-item"
				{...(handle ? {} : listeners)}
				tabIndex={handle ? -1 : undefined}
				ref={ref}
				className="flex min-h-[54px] w-[100px] shrink appearance-none items-center justify-center rounded-[5px] border-0 bg-[#181a22] px-4 py-2 shadow-sm outline-none"
				style={{
					...buttonStyle,
					transform: `translate3d(var(--translate-x, 0), var(--translate-y, 0), 0)
      scale(var(--scale, 1))`,
				}}
			>
				Drag me
			</button>
			{label && !dragging ? <label>{label}</label> : null}
		</div>
	);
});
