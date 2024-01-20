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
  const { join, participants } = useMeeting({
    onMeetingJoined: () => {
      setJoined("JOINED");
    },
  });

  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedMicrophone, setSelectedMicrophone] = useState(null);

  const joinMeeting = () => {
    setJoined("JOINING");
    join();
  };

  const handleCameraChange = (deviceId) => {
    setSelectedCamera(deviceId);
  };

  const handleMicrophoneChange = (deviceId) => {
    setSelectedMicrophone(deviceId);
  };

  useEffect(() => {
    // Fetch available media devices (cameras and microphones)
    async function fetchMediaDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const microphones = devices.filter(
          (device) => device.kind === "audioinput"
        );

        // Populate the camera and microphone select options
        const cameraSelect = document.getElementById("cameraSelect");
        const microphoneSelect = document.getElementById("microphoneSelect");

        cameras.forEach((camera) => {
          const option = document.createElement("option");
          option.value = camera.deviceId;
          option.text = camera.label;
          cameraSelect.appendChild(option);
        });

        microphones.forEach((microphone) => {
          const option = document.createElement("option");
          option.value = microphone.deviceId;
          option.text = microphone.label;
          microphoneSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error fetching media devices:", error);
      }
    }

    fetchMediaDevices();
  }, []);

  return (
    <div className="container">
      {joined && joined === "JOINED" ? (
        <div>
          {[...participants.keys()].map((participantId) => (
            <ParticipantView
              participantId={participantId}
              key={participantId}
              selectedCamera={selectedCamera}
              selectedMicrophone={selectedMicrophone}
            />
          ))}
        </div>
      ) : joined && joined === "JOINING" ? (
        <p>Joining the meeting...</p>
      ) : (
        <div>
          <button onClick={joinMeeting}>Join the meeting</button>

          <h3>Select Camera:</h3>
          <select
            id="cameraSelect"
            onChange={(e) => handleCameraChange(e.target.value)}
          >
            <option value={null}>Default Camera</option>
          </select>

          <h3>Select Microphone:</h3>
          <select
            id="microphoneSelect"
            onChange={(e) => handleMicrophoneChange(e.target.value)}
          >
            <option value={null}>Default Microphone</option>
          </select>
        </div>
      )}
    </div>
  );
}

function ParticipantView(props) {
  const micRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } =
    useParticipant(props.participantId, {
      cameraDeviceId: props.selectedCamera,
      microphoneDeviceId: props.selectedMicrophone,
    });
    console.log(displayName,'sa');
  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);

        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) =>
            console.error("videoElem.current.play() failed", error)
          );
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
          onError={(err) => {
            console.log(err, "participant video error");
          }}
        />
      )}
    </div>
  );
}

export default App;
