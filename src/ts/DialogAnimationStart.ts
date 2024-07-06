/**
 * Add the CSS variables for the mouse movement
 * @param e the MouseEvent for the click
 */
export default function DialogAnimationStart(e: MouseEvent) {
    document.body.style.setProperty("--positionX", `${e.clientX}px`);
    document.body.style.setProperty("--positionY", `${e.clientY}px`);
}