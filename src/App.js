import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import ReactPlayer from "react-player";

const App = () => {
  return (
    <MeetingProvider
      config={{
        meetingId: "fm63-dgm1-frkp",
        micEnabled: true,
        webcamEnabled: true,
        name: "Siddiq's Org",
      }}
      token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiIzODZlNjg1NC1iNGUwLTRkMDEtOWVkNi1hYjUwODczMDVkOTgiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTcwNTc1MDY5OCwiZXhwIjoxNzA1ODM3MDk4fQ.Ap0jdhyMIpWgYmBxFiHdGF-Ix2ktASA1NboX66sMP7Y"
    >
      <MeetingView />
    </MeetingProvider>
  );
};

function MeetingView() {
  const [joined, setJoined] = useState(null);
  const { join, leave, participants } = useMeeting({
    onMeetingJoined: () => {
      setJoined("JOINED");
    },
  });

  const [cameras, setCameras] = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedMicrophone, setSelectedMicrophone] = useState(null);

  useEffect(() => {
    async function fetchDevices() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter(device => device.kind === 'videoinput'));
      setMicrophones(devices.filter(device => device.kind === 'audioinput'));
    }

    fetchDevices();
  }, []);

  const joinMeeting = async () => {
    setJoined("JOINING");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined },
        audio: { deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined },
      });

      join({ mediaStream: stream });
    } catch (error) {
      console.error("Error joining the meeting:", error);
      setJoined("ERROR");
    }
  };

  const handleLogout = () => {
    leave();
    setJoined(null);
  };

  const handleCameraChange = (deviceId) => {
    setSelectedCamera(deviceId);
  };

  const handleMicrophoneChange = (deviceId) => {
    setSelectedMicrophone(deviceId);
  };

  const startScreenShare = async () => {
    if (joined === "JOINED") {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        // Implement screen share logic here, depending on your SDK's requirements
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    }
  };

  return (
    <div className="container">
      {joined === "JOINED" ? (
        <div>
          <button onClick={handleLogout}>Log Out</button>
          <button onClick={startScreenShare}>Share My Screen</button>
          {[...participants.keys()].map((participantId) => (
            <ParticipantView
              participantId={participantId}
              key={participantId}
            />
          ))}
        </div>
      ) : joined === "JOINING" ? (
        <p>Joining the meeting...</p>
      ) : joined === "ERROR" ? (
        <p>Error joining the meeting. Please check your camera and microphone settings.</p>
      ) : (
        <div>
          <button onClick={joinMeeting}>Join the meeting</button>

          <h3>Select Camera:</h3>
          <select onChange={(e) => handleCameraChange(e.target.value)}>
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId}`}
              </option>
            ))}
          </select>

          <h3>Select Microphone:</h3>
          <select onChange={(e) => handleMicrophoneChange(e.target.value)}>
            {microphones.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mic.deviceId}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function ParticipantView({ participantId }) {
  const micRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName, screenShareStream } = useParticipant(participantId);

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  const screenStream = useMemo(() => {
    if (screenShareStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(screenShareStream.track);
      return mediaStream;
    }
  }, [screenShareStream]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        micRef.current.srcObject = mediaStream;
        micRef.current.play().catch((error) => console.error("audioElem.current.play() failed", error));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <div>
      <audio ref={micRef} autoPlay playsInline muted={isLocal} />
      {webcamOn && (
        <ReactPlayer
          playsinline
          pip={false}
          light={false}
          controls={false}
          muted={true}
          playing={true}
          url={videoStream}
          height={"300px"}
          width={"300px"}
        />
      )}
      {screenShareStream && (
        <ReactPlayer
          playsinline
          pip={false}
          light={false}
          controls={true}
          muted={isLocal}
          playing={true}
          url={screenStream}
          width="100%"
          height="auto"
        />
      )}
    </div>
  );
}

export default App;
