




const getImageFromFile = (source: File | string) => {
    return new Promise((resolve) => {
        const image = document.createElement('img');
        image.onload = () => resolve(image);
        if (source instanceof File) {
            const reader = new FileReader;
            reader.onload = (e: ProgressEvent<FileReader>) => {
                image.src = e.target!.result!.toString();
            }
            reader.readAsDataURL(source);
        } else {
            image.src = source;
        }
    });
}


export default getImageFromFile;