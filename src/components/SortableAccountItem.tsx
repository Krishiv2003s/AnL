
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableAccountItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export function SortableAccountItem({ id, children, className }: SortableAccountItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: "relative" as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn("flex items-center gap-1", isDragging && "opacity-50", className)}>
            <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 no-print flex-shrink-0">
                <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 w-full min-w-0">
                {children}
            </div>
        </div>
    );
}
