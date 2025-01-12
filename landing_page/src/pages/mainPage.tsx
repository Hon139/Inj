function MainPage() {
    const clickHandlerUpload = async () => {
        const input = document.querySelector('.file-input');
        if (input.files && input.files.length > 0) {
            const formData = new FormData();
            formData.append('file', input.files[0]);
            formData.append('userID', '1');

            try {
                const response = await fetch('http://localhost:3000/quizzes', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.text();
                console.log('Upload Response:', data);
            } catch (error) {
                console.error('Error:', error);
            }
        } else {
            console.error('No file selected');
        }
    };

    return (
        <>
            <input
                type="file"
                className="file-input file-input-lg file-input-bordered file-input-primary w-full max-w-xs"
            />
            <button 
                className="btn btn-outline btn-accent btn-lg btn-wide" 
                type="button"
                onClick={clickHandlerUpload}
            >
                UPLOAD
            </button>

            <style>{`
                input {
                    display: flex;
                    justify-content: center;
                    flex-direction: column;
                    align-items: center;
                    margin: 42px;
                }
                
                h1 {
                    text-align: center;
                    font-size: 50px;
                    padding: 50px;
                }

                .btn {
                    display: flex;
                    justify-content: center;
                    flex-direction: column;
                    margin: 42px;
                }
            `}</style>
        </>
    );
}

export default MainPage;
