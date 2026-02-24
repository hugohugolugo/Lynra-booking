interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "ember" | "muted";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-lynra-ash text-lynra-granite border border-lynra-aluminium",
    ember: "bg-lynra-ember/10 text-lynra-ember border border-lynra-ember/20",
    muted: "bg-lynra-aluminium/40 text-lynra-haze",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium font-body ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
