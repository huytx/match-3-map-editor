import { playSound } from '@/utils/sound-controller';
import { cn } from '@/utils/twMerge';
import { motion } from 'framer-motion';

export const Button = ({
  className = '',
  children = null,
  onClick = null,
  style = {},
  disabled = false,
  disabledAnimationPress = false,
  ...props
}) => {
  const handleClick = () => {
    if (disabled) return;
    playSound('button');
    if (onClick) onClick();
  };
  return (
    <motion.button
      whileTap={!disabledAnimationPress && !disabled && { scale: 0.9 }}
      onClick={handleClick}
      className={cn('', className)}
      style={style}
      {...props}
    >
      {children}
    </motion.button>
  );
};
