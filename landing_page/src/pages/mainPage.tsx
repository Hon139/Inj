import { MouseEvent } from "react";

function MainPage() {
    const clickHandlerUpload = (event: MouseEvent) => {
        fetch('http://localhost:3000', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Upload button clicked' }),
        })
        .then(response => response.text())
        .then(data => {
            console.log('Upload Response:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    const clickHandlerLog = (event: MouseEvent) => {
        fetch('http://localhost:3000', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Sign In button clicked' }),
        })
        .then(response => response.text())
        .then(data => {
            console.log('Log Response:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    return (
        <>
            <h1>Home Page</h1>
            <img src="./instagram.png" alt="Instagram Logo" />
            <button 
                className="btn btn-outline btn-accent btn-lg btn-wide" 
                type="button"
                onClick={clickHandlerLog}
            >
                SIGN IN
            </button>
            <button 
                className="btn btn-outline btn-accent btn-lg btn-wide" 
                type="button"
                onClick={clickHandlerUpload}
            >
                UPLOAD
            </button>

            <input
                type="file"
                className="file-input file-input-lg file-input-bordered file-input-primary w-full max-w-xs"
            />

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
