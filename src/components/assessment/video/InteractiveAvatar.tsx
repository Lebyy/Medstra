import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import protobuf from "protobufjs";
import { Room, RoomEvent, VideoPresets } from "livekit-client";

const jsonDescriptor = {
  "options": {
    "syntax": "proto3"
  },
  "nested": {
    "pipecat": {
      "nested": {
        "TextFrame": {
          "fields": {
            "id": {
              "type": "uint64",
              "id": 1
            },
            "name": {
              "type": "string",
              "id": 2
            },
            "text": {
              "type": "string",
              "id": 3
            }
          }
        },
        "AudioRawFrame": {
          "fields": {
            "id": {
              "type": "uint64",
              "id": 1
            },
            "name": {
              "type": "string",
              "id": 2
            },
            "audio": {
              "type": "bytes",
              "id": 3
            },
            "sampleRate": {
              "type": "uint32",
              "id": 4
            },
            "numChannels": {
              "type": "uint32",
              "id": 5
            }
          }
        },
        "TranscriptionFrame": {
          "fields": {
            "id": {
              "type": "uint64",
              "id": 1
            },
            "name": {
              "type": "string",
              "id": 2
            },
            "text": {
              "type": "string",
              "id": 3
            },
            "userId": {
              "type": "string",
              "id": 4
            },
            "timestamp": {
              "type": "string",
              "id": 5
            }
          }
        },
        "Frame": {
          "oneofs": {
            "frame": {
              "oneof": [
                "text",
                "audio",
                "transcription"
              ]
            }
          },
          "fields": {
            "text": {
              "type": "TextFrame",
              "id": 1
            },
            "audio": {
              "type": "AudioRawFrame",
              "id": 2
            },
            "transcription": {
              "type": "TranscriptionFrame",
              "id": 3
            }
          }
        }
      }
    }
  }
};

const API_CONFIG = {
  serverUrl: "https://api.heygen.com",
  liveKitUrl: "wss://medstra-z001bo9s.livekit.cloud",
  liveKitApiKey: "APIFb4ihRTGinuQ",
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function convertFloat32ToS16PCM(float32Array: Float32Array) {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    const clampedValue = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = clampedValue < 0 ? clampedValue * 32768 : clampedValue * 32767;
  }
  return int16Array;
}

// export default function InteractiveAvatar({ preAssessmentData }: { preAssessmentData: {
//   height: string;
//   weight: string;
//   smoker: boolean;
//   exerciseFrequency: string;
// }  }) {
//   const [isLoadingSession, setIsLoadingSession] = useState(false);
//   const [stream, setStream] = useState<MediaStream>();
//   const [sessionInfo, setSessionInfo] = useState<any>(null);
//   const [room, setRoom] = useState<Room | null>(null);
//   const mediaStream = useRef<HTMLVideoElement>(null);
//   const webSocket = useRef<WebSocket | null>(null);
//   const [micStream, setMicStream] = useState<MediaStream | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   async function getSessionToken() {
//     const response = await fetch("/api/get-access-token", {
//       method: "POST",
//     });
//     const token = await response.text();
//     return token;
//   }

//   async function createSession(token: string) {
//     // Create new session
//     const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         version: "v2",
//         avatar_name: "Ann_Doctor_Sitting_public", // Use the specified avatar name
//       }),
//     });
    
//     const data = await response.json();

//     const sessionInfo = data.data;

//     // Start streaming
//     await fetch(`${API_CONFIG.serverUrl}/v1/streaming.start`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         session_id: sessionInfo.session_id,
//       }),
//     });

//     return sessionInfo;
//   }

//   async function connectWebSocket(sessionId: string, token: string) {
//     const params = new URLSearchParams({
//       session_id: sessionId,
//       session_token: token,
//       silence_response: "false",
//       stt_language: "en",
//     });

//     const wsUrl = `wss://${new URL(API_CONFIG.serverUrl).hostname}/v1/ws/streaming.chat?${params}`;
//     webSocket.current = new WebSocket(wsUrl);

//     webSocket.current.addEventListener("message", async (event) => {
//       console.log("Received message:", event.data);
      
//       const data = JSON.parse(event.data);
//       if (data.type === "transcript") {
//         console.log("Received transcript:", data.text);

//         const response = await fetch("/api/openai", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ 
//             prompt: data.text,
//             preAssessmentData 
//           }),
//         });

//         const { reply } = await response.json();
//         console.log("OpenAI response:", reply);
//         await sendText(reply);
//       }
//     });
//   }

//   async function sendText(text: string) {
//     if (!sessionInfo) return;

//     await fetch(`${API_CONFIG.serverUrl}/v1/streaming.task`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${sessionInfo.token}`,
//       },
//       body: JSON.stringify({
//         session_id: sessionInfo.session_id,
//         text,
//         task_type: "talk",
//       }),
//     });
//   }

//   async function requestMicrophoneAccess() {
//     try {
//       console.log('Requesting microphone access...');
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       console.log('Microphone access granted');
//       setMicStream(stream);
//       return stream;
//     } catch (error) {
//       console.error('Error accessing microphone:', error);
//       throw error;
//     }
//   }

//   async function startSession() {
//     setIsLoadingSession(true);
//     try {
//       // Request microphone access first
//       await requestMicrophoneAccess();
      
//       const token = await getSessionToken();
//       const session = await createSession(token);
//       setSessionInfo(session);
//       setToken(token);

//       const newRoom = new Room({
//         // Enable audio processing for speech recognition
//         audioCaptureDefaults: {
//           autoGainControl: true,
//           echoCancellation: true,
//           noiseSuppression: true,
//         }
//       });

//       await newRoom.connect(session.url, session.access_token);
//       setRoom(newRoom);

//       // Publish the microphone track to the room
//       if (micStream) {
//         await newRoom.localParticipant.publishTrack(micStream.getAudioTracks()[0]);
//       }

//       newRoom.on(RoomEvent.TrackSubscribed, (track) => {
//         if (track.kind === "video" || track.kind === "audio") {
//           const mediaStream = new MediaStream([track.mediaStreamTrack]);
//           setStream(mediaStream);
//         }
//       });

//       await connectWebSocket(session.session_id, token);

//     } catch (error) {
//       console.error("Error starting session:", error);
//     } finally {
//       setIsLoadingSession(false);
//     }
//   }

//   async function endSession() {
//     if (sessionInfo) {
//       await fetch(`${API_CONFIG.serverUrl}/v1/streaming.stop`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           session_id: sessionInfo.session_id,
//         }),
//       });

//       if (webSocket.current) {
//         webSocket.current.close();
//       }
//       if (room) {
//         room.disconnect();
//       }
//       setStream(undefined);
//       setSessionInfo(null);
//     }
//   }

//   useEffect(() => {
//     if (stream && mediaStream.current) {
//       mediaStream.current.srcObject = stream;
//       mediaStream.current.play();
//     }
//   }, [stream]);

//   return (
//     <Card className="overflow-hidden">
//       <div className="flex flex-col">
//         <div className="relative aspect-video bg-muted">
//           {stream && (
//             <video 
//               ref={mediaStream} 
//               autoPlay 
//               playsInline 
//               className="w-full h-full object-cover"
//             />
//           )}
//           {isLoadingSession && (
//             <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
//               <motion.div
//                 className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
//                 animate={{ rotate: 360 }}
//                 transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//               />
//             </div>
//           )}
//         </div>

//         <div className="grid grid-cols-1 gap-4 p-4">
//           <div className="flex gap-2">
//             {!sessionInfo ? (
//               <Button onClick={startSession} className="w-full">
//                 Start Session
//               </Button>
//             ) : (
//               <Button onClick={endSession} variant="destructive" className="w-full">
//                 End Session
//               </Button>
//             )}
//           </div>
//         </div>
//       </div>
//     </Card>
//   );
// }

export default function InteractiveAvatar({ preAssessmentData }: { preAssessmentData: {
  height: string;
  weight: string;
  smoker: boolean;
  exerciseFrequency: string;
}  }) {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);
  const mediaStream = useRef<HTMLVideoElement>(null);
  const [acceptMessages, setAcceptMessages] = useState(true);
  const [message, setMessage] = useState<string>("");

  async function fetchAccessToken() {
    const response = await fetch("/api/get-access-token", { method: "POST" });
    const token = await response.text();
    return token;
  }

  async function startSession() {
    setIsLoadingSession(true);
    try {
      const token = await fetchAccessToken();
      const newAvatar = new StreamingAvatar({ token });

      newAvatar.on(StreamingEvents.STREAM_READY, (event) => {
        setStream(event.detail);
      });

      // newAvatar.on(StreamingEvents.USER_TALKING_MESSAGE, (message) => {
      //   if (!acceptMessages) return;

      //   const newMessage = message.detail.message;

      //   setAcceptMessages(false);

      //   handleSpeak(newMessage);
      // });

      newAvatar.on(StreamingEvents.USER_SILENCE, () => {
        console.log('User is silent');
      });

      newAvatar.on(StreamingEvents.STREAM_DISCONNECTED, endSession);
      setAvatar(newAvatar);

      await newAvatar.createStartAvatar({
        quality: AvatarQuality.High,
        voice: {
          rate: 1.5,
          emotion: VoiceEmotion.FRIENDLY,
        },
        disableIdleTimeout: true,
        avatarName: "Ann_Doctor_Sitting_public",
        knowledgeBase: `You are an AI medical examiner conducting comprehensive health assessments. Follow this structured approach:

Initial Assessment:
- Begin by acknowledging the patient's pre-assessment data (height, weight, smoking status, exercise frequency)
- Calculate and reference BMI, noting any health implications
- Start with a professional greeting and explain the assessment process

Systematic Questioning (ask these in separate messages):
1. General Health:
   - Current medications and supplements
   - Recent hospitalizations or surgeries
   - Family history of serious conditions
   - Sleep patterns and quality
   - Stress levels and mental health

2. Symptom Assessment:
   - Current health complaints or symptoms
   - Duration and severity of symptoms
   - Pattern of symptoms (constant, intermittent)
   - Aggravating and alleviating factors

3. System-Specific Questions:
   - Cardiovascular (chest pain, palpitations, shortness of breath)
   - Respiratory (cough, wheezing, breathing difficulties)
   - Gastrointestinal (appetite, digestion, bowel habits)
   - Musculoskeletal (joint pain, mobility issues)
   - Neurological (headaches, dizziness, coordination)

4. Lifestyle Analysis:
   - Detailed exercise habits and physical activity
   - Diet and nutrition patterns
   - Sleep hygiene
   - Stress management techniques
   - Work-life balance

Final Assessment:
- Compile all gathered information
- Provide a comprehensive health evaluation
- List potential risk factors
- Offer specific recommendations
- Generate two reports:

1. Patient Report:
   - Overall health status
   - Key findings and concerns
   - Lifestyle recommendations
   - Suggested follow-up actions

2. Underwriting Report:
   - Risk assessment summary
   - Key medical findings
   - Lifestyle risk factors
   - Insurance implications
   - Risk classification recommendation

Communication Style:
- Maintain professional yet approachable tone
- Ask one category of questions at a time
- Wait for patient response before proceeding
- Provide clear, concise explanations
- Use medical terminology with lay explanations
- Show empathy while maintaining professional boundaries
- Keep responses conversational and natural for speech.
- Avoid using any special characters or formatting (no bullet points, numbers, or symbols).
- Break complex information into short, clear sentences.
- Keep responses concise, aiming for a maximum of 2-3 sentences.
- Avoid line breaks and unnecessary pauses in conversation.
- Use natural transitions between topics.
- Focus on providing direct answers to questions without excessive detail.
- Avoid mentioning specific data formats or technical terms unless necessary.
- Don't use line breaks or paragraph formatting.

Remember to:
- Document all responses systematically
- Flag any concerning symptoms or combinations
- Consider interactions between different health factors
- Provide evidence-based recommendations
- Maintain focus on both immediate and long-term health implications`
      });

      await newAvatar.startVoiceChat({ useSilencePrompt: true });

      // const response = await fetch("/api/openai", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     prompt: "Hey there! Let's start the conversation.",
      //     preAssessmentData: preAssessmentData,
      //   }),
      // });

      // const { reply } = await response.json();
      // await newAvatar.speak({ text: reply, taskType: TaskType.REPEAT });

    } catch (error) {
      console.error("Error starting session:", error);
    } finally {
      setIsLoadingSession(false);
    }
  }

  async function handleSpeak(message: string) {
    if (!avatar || !message) return;

    const response = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: message }),
    });

    const { reply } = await response.json();

    await avatar.speak({ text: reply });

    setMessage("");

    setAcceptMessages(true);
  }

  async function endSession() {
    if (avatar) {
      await avatar.closeVoiceChat();
      await avatar.stopAvatar();
      setStream(undefined);
      setAvatar(null);
    }
  }

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.play();
    }
  }, [stream]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col">
        <div className="relative aspect-video bg-muted">
          {stream && (
            <video 
              ref={mediaStream} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          )}
          {isLoadingSession && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <motion.div
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 p-4">
          <div className="flex gap-2">
            {!avatar ? (
              <Button onClick={startSession} className="w-full">
                Start Session
              </Button>
            ) : (
              <Button onClick={endSession} variant="destructive" className="w-full">
                End Session
              </Button>
            )}
          </div>

          {/* {avatar && (
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAvatarTalking}
                className="flex-1"
              />
              <Button 
                onClick={() => handleSpeak(message)}
                disabled={!message || isAvatarTalking}
              >
                Send
              </Button>
              <Button
                onClick={toggleRecording}
                disabled={isAvatarTalking}
              >
                {isRecording ? <MicOff /> : <Mic />}
              </Button>
            </div>
          )} */}
        </div>

        {/* Chat UI Section
        <div className="mt-4 p-4 border-t border-gray-300">
          <h3 className="text-lg font-semibold">Chat</h3>
          <div className="overflow-y-auto max-h-60 border rounded-lg p-2">
            {messages.map((msg, index) => (
              <div key={index} className={`text-sm ${msg.sender === "AI" ? "text-gray-700" : "text-blue-600"}`}>
                <strong>{msg.sender}: </strong>{msg.text}
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </Card>
  );
}


export interface StreamingAvatarApiConfig {
  token: string;
  basePath?: string;
}

export enum AvatarQuality {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}
export enum VoiceEmotion {
  EXCITED = 'excited',
  SERIOUS = 'serious',
  FRIENDLY = 'friendly',
  SOOTHING = 'soothing',
  BROADCASTER = 'broadcaster',
}
export interface ElevenLabsSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}
export interface StartAvatarRequest {
  quality?: AvatarQuality;
  avatarName: string;
  voice?: {
    voiceId?: string
    rate?: number;
    emotion?: VoiceEmotion;
    elevenlabsSettings?: ElevenLabsSettings;
  };
  knowledgeId?: string;
  language?: string;
  knowledgeBase?: string;
  disableIdleTimeout?: boolean;
}

export interface StartAvatarResponse {
  session_id: string,
  access_token: string,
  url: string,
  is_paid: boolean,
  session_duration_limit: number
}

export enum TaskType {
  TALK = 'talk',
  REPEAT = 'repeat',
}
export enum TaskMode {
  SYNC = 'sync',
  ASYNC = 'async',
}
export interface SpeakRequest {
  text: string;
  task_type?: TaskType; // should use camelCase
  taskType?: TaskType;
  taskMode?: TaskMode;
}

export interface CommonRequest {
  [key: string]: any;
}

// event types --------------------------------
export enum StreamingEvents {
  AVATAR_START_TALKING = 'avatar_start_talking',
  AVATAR_STOP_TALKING = 'avatar_stop_talking',
  AVATAR_TALKING_MESSAGE = 'avatar_talking_message',
  AVATAR_END_MESSAGE = 'avatar_end_message',
  USER_TALKING_MESSAGE = 'user_talking_message',
  USER_END_MESSAGE = 'user_end_message',
  USER_START = 'user_start',
  USER_STOP = 'user_stop',
  USER_SILENCE = 'user_silence',
  STREAM_READY = 'stream_ready',
  STREAM_DISCONNECTED = 'stream_disconnected',
}
export type EventHandler = (...args: any[]) => void;
export interface EventData {
  [key: string]: unknown;
  task_id: string;
}

export interface StreamingStartTalkingEvent extends EventData {
  type: StreamingEvents.AVATAR_START_TALKING;
}

export interface StreamingStopTalkingEvent extends EventData {
  type: StreamingEvents.AVATAR_STOP_TALKING;
}

export interface StreamingTalkingMessageEvent extends EventData {
  type: StreamingEvents.AVATAR_TALKING_MESSAGE;
  message: string;
}

export interface StreamingTalkingEndEvent extends EventData {
  type: StreamingEvents.AVATAR_END_MESSAGE;
}

export interface UserTalkingMessageEvent extends EventData {
  type: StreamingEvents.USER_TALKING_MESSAGE;
  message: string;
}

export interface UserTalkingEndEvent extends EventData {
  type: StreamingEvents.USER_END_MESSAGE;
}

type StreamingEventTypes =
  | StreamingStartTalkingEvent
  | StreamingStopTalkingEvent
  | StreamingTalkingMessageEvent
  | StreamingTalkingEndEvent
  | UserTalkingMessageEvent
  | UserTalkingEndEvent;

interface WebsocketBaseEvent {
  [key: string]: unknown;
}
interface UserStartTalkingEvent extends WebsocketBaseEvent {
  event_type: StreamingEvents.USER_START;
}
interface UserStopTalkingEvent extends WebsocketBaseEvent {
  event_type: StreamingEvents.USER_STOP;
}
interface UserSilenceEvent extends WebsocketBaseEvent {
  event_type: StreamingEvents.USER_SILENCE;
  silence_times: number;
  count_down: number;
}

type StreamingWebSocketEventTypes = UserStartTalkingEvent | UserStopTalkingEvent | UserSilenceEvent;

class APIError extends Error {
  public status: number;
  public responseText: string;

  constructor(message: string, status: number, responseText: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.responseText = responseText;
  }
}

class StreamingAvatar {
  public room: Room | null = null;
  public mediaStream: MediaStream | null = null;

  private readonly token: string;
  private readonly basePath: string;
  private eventTarget = new EventTarget();
  private audioContext: AudioContext | null = null;
  private webSocket: globalThis.WebSocket | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStreamAudioSource: MediaStreamAudioSourceNode | null = null;
  private mediaDevicesStream: MediaStream | null = null;
  private audioRawFrame: protobuf.Type | undefined;
  private sessionId: string | null = null;
  private language: string | undefined;

  constructor({
    token,
    basePath = "https://api.heygen.com",
  }: StreamingAvatarApiConfig) {
    this.token = token;
    this.basePath = basePath;
  }

  public async createStartAvatar(requestData: StartAvatarRequest): Promise<any> {
    const sessionInfo = await this.newSession(requestData);
    this.sessionId = sessionInfo.session_id;
    this.language = requestData.language;

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      }
    });

    this.room = room;
    this.mediaStream = null;

    room.on(RoomEvent.DataReceived, (roomMessage) => {
      let eventMsg: StreamingEventTypes | null = null;
      try {
        const messageString = new TextDecoder().decode(
          roomMessage as unknown as ArrayBuffer,
        );
        eventMsg = JSON.parse(messageString) as StreamingEventTypes;
      } catch (e) {
        console.error(e);
      }
      if (!eventMsg) {
        return;
      }
      this.emit(eventMsg.type, eventMsg);
    });

    const mediaStream = new MediaStream();
    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === "video" || track.kind === "audio") {
        mediaStream.addTrack(track.mediaStreamTrack);

        const hasVideoTrack = mediaStream.getVideoTracks().length > 0;
        const hasAudioTrack = mediaStream.getAudioTracks().length > 0;
        if (
          hasVideoTrack &&
          hasAudioTrack &&
          !this.mediaStream
        ) {
          this.mediaStream = mediaStream;
          this.emit(StreamingEvents.STREAM_READY, this.mediaStream);
        }
      }
    });
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      const mediaTrack = track.mediaStreamTrack;
      if (mediaTrack) {
        mediaStream.removeTrack(mediaTrack);
      }
    });

    room.on(RoomEvent.Disconnected, (reason) => {
      this.emit(StreamingEvents.STREAM_DISCONNECTED, reason);
    });

    try {
      await room.prepareConnection(sessionInfo.url, sessionInfo.access_token);
    } catch (error) {}

    await this.startSession();

    await room.connect(sessionInfo.url, sessionInfo.access_token);

    return sessionInfo;
  }

  public async startVoiceChat (requestData: { useSilencePrompt?: boolean } = {}) {
    requestData.useSilencePrompt = requestData.useSilencePrompt || false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }

    try {
      await this.loadAudioRawFrame();
      await this.connectWebSocket({ useSilencePrompt: requestData.useSilencePrompt });

      this.audioContext = new window.AudioContext({
        latencyHint: 'interactive',
        sampleRate: 16000,
      });
      const devicesStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      this.mediaDevicesStream = devicesStream;

      this.mediaStreamAudioSource = this.audioContext?.createMediaStreamSource(devicesStream);
      this.scriptProcessor = this.audioContext?.createScriptProcessor(512, 1, 1);

      this.mediaStreamAudioSource.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext?.destination);

      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.webSocket) {
          return;
        }
        const audioData = event.inputBuffer.getChannelData(0);
        const pcmS16Array = convertFloat32ToS16PCM(audioData);
        const pcmByteArray = new Uint8Array(pcmS16Array.buffer);
        const frame = this.audioRawFrame?.create({
          audio: {
            audio: Array.from(pcmByteArray),
            sampleRate: 16000,
            numChannels: 1,
          },
        });
        const encodedFrame = new Uint8Array(this.audioRawFrame?.encode(frame as unknown as protobuf.Message).finish() as unknown as ArrayBuffer);
        this.webSocket?.send(encodedFrame);
      };

      // though room has been connected, but the stream may not be ready.
      await sleep(2000);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  public closeVoiceChat () {
    try {
      if (this.audioContext) {
        this.audioContext = null;
      }
      if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor = null;
      }
      if (this.mediaStreamAudioSource) {
        this.mediaStreamAudioSource.disconnect();
        this.mediaStreamAudioSource = null;
      }
      if (this.mediaDevicesStream) {
        this.mediaDevicesStream?.getTracks()?.forEach((track) => track.stop());
        this.mediaDevicesStream = null;
      }
      if (this.webSocket) {
        this.webSocket.close();
      }
    } catch (e) {}
  }

  public async newSession(
    requestData: StartAvatarRequest,
  ): Promise<StartAvatarResponse> {
    return this.request("/v1/streaming.new", {
      avatar_name: requestData.avatarName,
      quality: requestData.quality,
      knowledge_base_id: requestData.knowledgeId,
      knowledge_base: requestData.knowledgeBase,
      voice: {
        voice_id: requestData.voice?.voiceId,
        rate: requestData.voice?.rate,
        emotion: requestData.voice?.emotion,
        elevenlabs_settings: requestData?.voice?.elevenlabsSettings,
      },
      language: requestData.language,
      version: "v2",
      video_encoding: "H264",
      source: 'sdk',
      disable_idle_timeout: requestData.disableIdleTimeout,
    });
  }
  public async startSession(): Promise<any> {
    return this.request("/v1/streaming.start", {
      session_id: this.sessionId,
    });
  }
  public async speak(requestData: SpeakRequest): Promise<any> {
    requestData.taskType = requestData.taskType || requestData.task_type || TaskType.TALK;
    requestData.taskMode = requestData.taskMode || TaskMode.ASYNC;

    // try to use websocket first
    // only support talk task
    if (this.webSocket && this.audioRawFrame && requestData.task_type === TaskType.TALK && requestData.taskMode !== TaskMode.SYNC) {
      const frame = this.audioRawFrame?.create({
        text: {
          text: requestData.text,
        },
      });
      const encodedFrame = new Uint8Array(this.audioRawFrame?.encode(frame).finish());
      this.webSocket?.send(encodedFrame);
      return;
    }
    return this.request("/v1/streaming.task", {
      text: requestData.text,
      session_id: this.sessionId,
      task_mode: requestData.taskMode,
      task_type: requestData.taskType,
    });
  }

  public async startListening(): Promise<any> {
    return this.request("/v1/streaming.start_listening", {
      session_id: this.sessionId,
    });
  }
  public async stopListening(): Promise<any> {
    return this.request("/v1/streaming.stop_listening", {
      session_id: this.sessionId,
    });
  }
  public async interrupt(): Promise<any> {
    return this.request("/v1/streaming.interrupt", {
      session_id: this.sessionId,
    });
  }

  public async stopAvatar(): Promise<any> {
    // clear some resources
    this.closeVoiceChat();
    return this.request("/v1/streaming.stop", {
      session_id: this.sessionId,
    });
  }

  public on(eventType: string, listener: EventHandler): this {
    this.eventTarget.addEventListener(eventType, listener);
    return this;
  }

  public off(eventType: string, listener: EventHandler): this {
    this.eventTarget.removeEventListener(eventType, listener);
    return this;
  }

  private async request(path: string, params: CommonRequest, config?: any): Promise<any> {
    try {
      const response = await fetch(this.getRequestUrl(path), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new APIError(
          `API request failed with status ${response.status}`,
          response.status,
          errorText
        );
      }

      const jsonData = await response.json();
      return jsonData.data
    } catch (error) {
      throw error;
    }
  }

  private emit(eventType: string, detail?: any) {
    const event = new CustomEvent(eventType, { detail });
    this.eventTarget.dispatchEvent(event);
  }
  private getRequestUrl(endpoint: string): string {
    return `${this.basePath}${endpoint}`;
  }
  private async connectWebSocket (requestData: { useSilencePrompt: boolean }) {
    let websocketUrl = `wss://${new URL(this.basePath).hostname}/v1/ws/streaming.chat?session_id=${this.sessionId}&session_token=${this.token}&silence_response=${requestData.useSilencePrompt}`;
    if (this.language) {
      websocketUrl += `&stt_language=${this.language}`;
    }
    this.webSocket = new WebSocket(websocketUrl);
    this.webSocket.addEventListener('message', (event) => {
      let eventData: StreamingWebSocketEventTypes | null = null;
      try {
        eventData = JSON.parse(event.data);
      } catch (e) {
        console.error(e);
        return;
      }
      this.emit(eventData?.event_type!, eventData);
    });
    this.webSocket.addEventListener('close', (event) => {
      this.webSocket = null;
    });
    return new Promise((resolve, reject) => {
      this.webSocket?.addEventListener('error', (event) => {
        this.webSocket = null;
        reject(event);
      });
      this.webSocket?.addEventListener('open', () => {
        resolve(true);
      });
    });
  }
  private async loadAudioRawFrame () {
    if (!this.audioRawFrame) {
      const root = protobuf.Root.fromJSON(jsonDescriptor );
      this.audioRawFrame = root?.lookupType('pipecat.Frame');
    }
  }
}