declare module "@radix-ui/react-icons" {
  import { ComponentProps, FC } from "react";

  export interface IconProps extends ComponentProps<"svg"> {
    className?: string;
  }

  export const CalendarIcon: FC<IconProps>;
  export const CheckIcon: FC<IconProps>;
  export const PersonIcon: FC<IconProps>;
  export const UpdateIcon: FC<IconProps>;
  export const PlayIcon: FC<IconProps>;
  // Added missing icons
  export const TrashIcon: FC<IconProps>;
  export const PlusIcon: FC<IconProps>;
  export const Cross1Icon: FC<IconProps>;
  export const ExclamationTriangleIcon: FC<IconProps>;
  export const DiscIcon: FC<IconProps>;
  export const ArrowLeftIcon: FC<IconProps>;
  // Add other icons as needed
}
