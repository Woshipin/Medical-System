import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  isLoading = false,
  className = '',
  icon,
  ...props 
}) => {
  // 基础样式：弹性布局、居中、过渡动画、圆角、禁止状态
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-wide transition-all duration-300 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  // 变体样式：颜色、背景、边框、阴影
  const variants = {
    primary: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:to-emerald-400 border border-transparent",
    secondary: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-transparent",
    outline: "bg-transparent border-2 border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600",
    ghost: "bg-transparent text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50",
    white: "bg-white text-emerald-600 shadow-md hover:shadow-lg border border-transparent"
  };

  // 尺寸样式
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    xl: "px-10 py-5 text-xl"
  };

  // 宽度控制
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${widthClass} 
        ${className}
      `}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};