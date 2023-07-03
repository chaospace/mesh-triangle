

const raf = (callbackHandler: (() => void)) => {

    let animateID: number;
    const animate = () => {
        callbackHandler();
        animateID = requestAnimationFrame(animate);
    };

    const cancel = () => cancelAnimationFrame(animateID);

    return {
        animate,
        cancel
    }
}




export default raf;