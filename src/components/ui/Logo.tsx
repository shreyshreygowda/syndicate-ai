import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-sm" },
    md: { icon: 32, text: "text-base" },
    lg: { icon: 48, text: "text-xl" },
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logo.svg"
        alt="Syndicate 708"
        width={sizes[size].icon}
        height={sizes[size].icon}
        priority
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-bold tracking-widest text-black uppercase",
              sizes[size].text
            )}
          >
            Syndicate
          </span>
          <span className="text-syndicate-blue font-bold text-lg leading-tight">
            708
          </span>
        </div>
      )}
    </div>
  );
}
