import { FormEvent, useEffect, useRef, useState } from "react";
import MessageBubble from "./components/MessageBubble";
import MessageForm from "./components/MessageForm";
import { socket } from "./socket";

type MessageData = {
    type: 'message-bubble' | 'message-log';
    username: string;
    message: string;
}

const App = () => {
    // Form fields data
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');

    // Other stuff
    const [formError, setFormError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [messageDataLogs, setMessageDataLogs] = useState<MessageData[] | null>(null);
    const messageLogsRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messageLogsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
        });
    }, [messageDataLogs])

    useEffect(() => {
        const onConnect = () => {
            setIsConnected(true)
        }

        const onDisconnect = () => {
            setIsConnected(false)
        }

        const onChatMessage = (messageData: MessageData) => {
            setMessageDataLogs(prevLogs => {
                return prevLogs
                    ? [...prevLogs, messageData]
                    : [messageData]
            })
        }

        const onUserJoined = (username: string) => {
            const messageDataLog: MessageData = {
                type: 'message-log',
                username,
                message: 'joined the chat!'
            }

            setMessageDataLogs(prevMessageDataLogs => {
                return prevMessageDataLogs
                    ? [...prevMessageDataLogs, messageDataLog]
                    : [messageDataLog]
            });
        }

        const onUserLeft = (username: string) => {
            const messageDataLog: MessageData = {
                type: 'message-log',
                username,
                message: 'left the chat!'
            }

            setMessageDataLogs(prevMessageDataLogs => {
                return prevMessageDataLogs
                    ? [...prevMessageDataLogs, messageDataLog]
                    : [messageDataLog]
            });
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('chatMessage', onChatMessage);

        socket.on('userJoined', onUserJoined);
        socket.on('userLeft', onUserLeft);

        return () => {
            socket.emit('userLeft', username);

            socket.off('connect');
            socket.off('disconnect');
            socket.off('chatMessage');

            socket.off('userJoined');
            socket.off('userLeft');
        }
    }, []);

    const handleUsernameSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (username === "") {
            setFormError("Username can't be empty");
            return;
        }

        socket.emit('userJoined', username).connect();
    }

    const handleMessageSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const messageData: MessageData = {
            type: 'message-bubble',
            username,
            message
        }

        socket.emit('chatMessage', messageData);

        setMessage('');
    }

    return (
        <div className='relative h-screen'>
            {!isConnected && (
                <form onSubmit={handleUsernameSubmit}>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-800 text-sm px-3 py-2 color-white outline-none"
                    />

                    {formError && (
                        <h1 className='absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-full text-sm text-red-500/80 mt-2'>{formError}</h1>
                    )}
                </form>
            )}

            {/* FIX: Proper scroll on message */}
            {isConnected && (
                <>
                    <div className='pt-5 px-3 pb-16 flex flex-col gap-3' ref={messageLogsRef}>
                        {messageDataLogs && messageDataLogs.map((messageData, index) => (
                            <MessageBubble key={index} messageData={messageData} username={username} />
                        ))}
                    </div>

                    <MessageForm
                        message={message}
                        setMessage={setMessage}
                        handleMessageSubmit={handleMessageSubmit}
                    />
                </>
            )}
        </div>
    )
}

export default App;
