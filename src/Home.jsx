/*
Copyright 2021 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { useCallback, useRef, useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { useRooms } from "./ConferenceCallManagerHooks";
import { Header, LeftNav, UserNav } from "./Header";
import ColorHash from "color-hash";
import styles from "./Home.module.css";
import { FieldRow, InputField, Button, ErrorMessage } from "./Input";
import { Center, Content, Modal } from "./Layout";

const colorHash = new ColorHash({ lightness: 0.3 });

export function Home({ manager }) {
  const history = useHistory();
  const roomNameRef = useRef();
  const guestAccessRef = useRef();
  const [createRoomError, setCreateRoomError] = useState();
  const rooms = useRooms(manager);

  const onCreateRoom = useCallback(
    (e) => {
      e.preventDefault();
      setCreateRoomError(undefined);

      async function createRoom(name, guestAccess) {
        const { room_id } = await manager.client.createRoom({
          visibility: "private",
          preset: "public_chat",
          name,
          power_level_content_override: guestAccess
            ? {
                invite: 100,
                kick: 100,
                ban: 100,
                redact: 50,
                state_default: 0,
                events_default: 0,
                users_default: 0,
                events: {
                  "m.room.power_levels": 100,
                  "m.room.history_visibility": 100,
                  "m.room.tombstone": 100,
                  "m.room.encryption": 100,
                  "m.room.name": 50,
                  "m.room.message": 0,
                  "m.room.encrypted": 50,
                  "m.sticker": 50,
                },
                users: {
                  [manager.client.getUserId()]: 100,
                },
              }
            : undefined,
        });

        if (guestAccess) {
          await manager.client.setGuestAccess(room_id, {
            allowJoin: true,
            allowRead: true,
          });
        }

        history.push(`/room/${room_id}`);
      }

      createRoom(
        roomNameRef.current.value,
        guestAccessRef.current.checked
      ).catch(setCreateRoomError);
    },
    [manager]
  );

  const onLogout = useCallback(
    (e) => {
      e.preventDefault();
      manager.logout();
      location.reload();
    },
    [manager]
  );

  return (
    <>
      <Header>
        <LeftNav />
        <UserNav
          signedIn={manager.client}
          userName={manager.client.getUserId()}
          onLogout={onLogout}
        />
      </Header>
      <Content>
        <Center>
          <Modal>
            <section>
              <form onSubmit={onCreateRoom}>
                <h2>Create New Room</h2>
                <FieldRow>
                  <InputField
                    id="roomName"
                    name="roomName"
                    label="Room Name"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Room Name"
                    ref={roomNameRef}
                  />
                </FieldRow>
                <FieldRow>
                  <InputField
                    id="guestAccess"
                    name="guestAccess"
                    label="Allow Guest Access"
                    type="checkbox"
                    ref={guestAccessRef}
                  />
                </FieldRow>
                {createRoomError && (
                  <FieldRow>
                    <ErrorMessage>{createRoomError.message}</ErrorMessage>
                  </FieldRow>
                )}
                <FieldRow rightAlign>
                  <Button type="submit">Create Room</Button>
                </FieldRow>
              </form>
            </section>
            <section>
              <h3>Recent Rooms</h3>
              <div className={styles.roomList}>
                {rooms.map((room) => (
                  <Link
                    className={styles.roomListItem}
                    key={room.roomId}
                    to={`/room/${room.roomId}`}
                  >
                    <div
                      className={styles.roomAvatar}
                      style={{ backgroundColor: colorHash.hex(room.name) }}
                    >
                      <span>{room.name.slice(0, 1)}</span>
                    </div>
                    <div className={styles.roomName}>{room.name}</div>
                  </Link>
                ))}
              </div>
            </section>
          </Modal>
        </Center>
      </Content>
    </>
  );
}
