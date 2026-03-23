import eventEmitter, { ModalState } from "@/utils/event-emitter";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

export const openModal = (
  child: ReactElement,
  effect = true,
  backgroundColor?: string
) => {
  eventEmitter.emit("changeModalState", {
    visible: true,
    child,
    effect,
    backgroundColor,
  });
};

export const closeModal = () => {
  eventEmitter.emit("changeModalState", {
    visible: false,
  });
};

const defaultState: ModalState = {
  visible: false,
  child: null,
  effect: false,
  backgroundColor: null,
};

export const ModalContainer = () => {
  const [state, setState] = useState<ModalState>(defaultState);

  useEffect(() => {
    const listener = (newState: Partial<ModalState>) => {
      setState((s) => ({ ...s, ...newState }));
    };
    eventEmitter.addListener("changeModalState", listener);
    return () => {
      eventEmitter.removeListener("changeModalState", listener);
    };
  }, []);

  const isHexColor = state.backgroundColor
    ? /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(state.backgroundColor)
    : false;

  const bgColor = !state.backgroundColor
    ? "bg-black"
    : `bg-${isHexColor ? `[${state.backgroundColor}]` : state.backgroundColor}`;

  const transition = state.effect
    ? "duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
    : "";

  return (
    <Dialog
      open={state.visible}
      as="div"
      className="relative z-99 focus:outline-none"
      onClose={() => {}}
    >
      <div
        className={`fixed inset-0 z-99 w-screen overflow-hidden ${bgColor} bg-opacity-80`}
        style={state.backgroundColor ? { backgroundColor: state.backgroundColor } : undefined}
      >
        <DialogPanel
          transition
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${transition}`}
        >
          {state.child}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
