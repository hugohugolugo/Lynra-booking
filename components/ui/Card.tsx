"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", selected = false, onClick }: CardProps) {
  const interactive = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        bg-lynra-white rounded-xl p-6
        transition-all duration-150
        ${interactive ? "cursor-pointer hover:-translate-y-0.5 hover:bg-lynra-ash/60" : ""}
        ${selected
          ? "ring-2 ring-lynra-ember"
          : interactive ? "ring-1 ring-lynra-aluminium hover:ring-lynra-clay" : ""
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}
