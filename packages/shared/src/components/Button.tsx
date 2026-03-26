import { playSound } from '../utils/sound-controller';
import { cn } from '../utils/twMerge';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  className?: string;
  children?: ReactNode;
  onClick?: (() => void) | null;
  style?: React.CSSProperties;
  disabled?: boolean;
  disabledAnimationPress?: boolean;
  [key: string]: any;
}

export const Button = ({
  className = '',
  children = null,
  onClick = null,
  style = {},
  disabled = false,
  disabledAnimationPress = false,
  ...props
}: ButtonProps) => {
  const handleClick = () => {
    if (disabled) return;
    playSound('button');
    if (onClick) onClick();
  };
  return (
    <motion.button
      whileTap={!disabledAnimationPress && !disabled ? { scale: 0.9 } : undefined}
      onClick={handleClick}
      className={cn('', className)}
      style={style}
      {...props}
    />
  );
};
