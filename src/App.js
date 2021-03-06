import React, { useState, useContext, useEffect, useMemo, useCallback } from "react";
import {
  Badge,
  Button,
  Grid,
  Card,
  CardActions,
  CardContent,
  Typography,
  Backdrop,
  IconButton,
  ImageListItemBar,
  ImageListItem,
  ImageList,
  ListItemText,
  ListItemIcon,
  ListItem,
  List,
  ListSubheader,
  Divider,
  TextField,
} from "@material-ui/core";
import { AddAPhoto, Send, Person, DeleteForever } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import "./App.css";
import { SocketContext } from "./socket";

const useStyles = makeStyles((theme) => ({
  root: {},
  fileInput: {
    display: "none",
  },
  userList: {
    width: "100%",
    backgroundColor: theme.palette.background.paper,
    position: "relative",
    overflow: "auto",
    maxHeight: window.innerHeight,
  },
  imageList: {
    maxHeight: window.innerHeight * 0.9,
  },
  icon: {
    color: "rgba(255, 255, 255, 0.54)",
  },
  nested: {
    paddingLeft: theme.spacing(3),
  },
  imageListGridContainer: {
    minHeight: window.innerHeight,
    maxHeight: window.innerHeight,
    position: "relative",
    background: "gray",
  },
  imageListControlButtons: {
    height: "auto",
    background: "#FFF",
  },
  backdrop: {
    position: "absolute",
    zIndex: theme.zIndex.drawer + 1,
  },
  card: {
    minWidth: 275,
    height: 50,
  },
  title: {
    fontSize: 18,
  },
}));

export default function App() {
  const classes = useStyles();

  const socket = useContext(SocketContext);

  const [state, setState] = useState({
    clients: {},
    owner: {},
    photos: {},
    texts: {},
    selectedImg: "",
    selectedClientId: undefined,
  });

  const [textMessage, setTextMessage] = useState("");

  /**
   * Assigns selected photo to state as selectedImg.
   * @param event
   */
  const handleCapture = (event) => {
    if (event.target.files[0]) {
      let reader = new FileReader();
      reader.onload = (e) => {
        setState((prevState) => ({ ...prevState, selectedImg: e.target.result }));
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  /**
   * Sends the image to the client.
   */
  const sendPhoto = () => {
    socket.send(
      JSON.stringify({
        type: "photo",
        messageData: state.selectedImg,
        toId: state.selectedClientId,
      })
    );
    setState((prevState) => ({ ...prevState, selectedImg: "" }));
  };

  const sendText = () => {
    socket.send(
      JSON.stringify({
        type: "text",
        messageData: textMessage,
        toId: state.selectedClientId,
      })
    );
    setState((prevState) => ({ ...prevState }));
    setTextMessage("");
  };

  /*
  const sendMessage = ({ type, data, toId }) => {
    //type -> photo || text
    socket.send(
      JSON.stringify({
        type,
        messageData: data,
        toId,
      })
    );
    setState((prevState) => ({ ...prevState, selectedImg: "" }));
  };
  */

  /**
   * Deletes the image from the client.
   * @param photoId
   */
  const deletePhoto = (photoId) => {
    socket.send(
      JSON.stringify({
        type: "photo-delete",
        messageData: photoId,
        toId: state.selectedClientId,
      })
    );

    handleDeletePhoto({ messageData: photoId, from: state.selectedClientId });
  };

  const deleteText = (textId) => {
    socket.send(
      JSON.stringify({
        type: "text-delete",
        messageData: textId,
        toId: state.selectedClientId,
      })
    );

    handleDeleteText({ messageData: textId, from: state.selectedClientId });
  };

  /**
   * Assigns the client selected from the clients list to state as 'selectedClientId'
   * @param client
   */
  const handleClientClick = (client) => {
    setState((prevState) => ({ ...prevState, selectedClientId: client.id }));
    setState((prevState) => {
      const clients = prevState.clients;
      clients[client.id]["newMessage"] = false;
      return { ...prevState, clients };
    });
  };

  /**
   * Assigns the received photo from the client to state
   * @param id
   * @param photoData
   * @param from
   * @param isReverted
   */
  const handleNewPhoto = useCallback(({ id, messageData: photoData, from, isReverted }) => {
    setState((prevState) => {
      const photos = prevState.clients[from].photos;
      photos[id] = { id, photoData, from, isReverted };
      return { ...prevState, photos };
    });
    if (!isReverted) {
      setState((prevState) => {
        const clients = prevState.clients;
        clients[from]["newMessage"] = true;
        return { ...prevState, clients };
      });
    }
  }, []);

  const handleNewText = useCallback(({ id, messageData: textData, from, isReverted }) => {
    setState((prevState) => {
      const texts = prevState.clients[from].texts;
      texts[id] = { id, textData, from, isReverted };
      return { ...prevState, texts };
    });
    if (!isReverted) {
      setState((prevState) => {
        const clients = prevState.clients;
        clients[from]["newMessage"] = true;
        return { ...prevState, clients };
      });
    }
  }, []);

  /**
   * Deletes the received photo from the client from state
   * @param id
   * @param from
   */
  const handleDeletePhoto = useCallback(({ id, messageData: photoId, from, isReverted }) => {
    setState((prevState) => {
      const photos = prevState.clients[from].photos;
      delete photos[photoId];
      return { ...prevState, photos };
    });
  }, []);

  const handleDeleteText = useCallback(({ id, messageData: textId, from, isReverted }) => {
    setState((prevState) => {
      const texts = prevState.clients[from].texts;
      delete texts[textId];
      return { ...prevState, texts };
    });
  }, []);

  /**
   * Assigns the clients to state
   * @param _clients
   */
  const handleClients = useCallback(({ id, messageData: _clients, from, isReverted }) => {
    let clients = _clients.reduce((o, c) => ((o[c["id"]] = c), o), {});
    setState((prevState) => ({ ...prevState, clients }));
  }, []);

  /**
   * Assigns the connected client to state
   * @param client
   */
  const handleClientConnected = useCallback(({ id, messageData: client, from, isReverted }) => {
    setState((prevState) => {
      const clients = prevState.clients;
      clients[client.id] = client;
      return { ...prevState, clients };
    });
  }, []);

  /**
   * Deletes the disconnected client from state
   * @param client
   */
  const handleClientDisconnected = useCallback(({ id, messageData: client, from, isReverted }) => {
    setState((prevState) => {
      const clients = prevState.clients;
      delete clients[client.id];
      return { ...prevState, clients };
    });
    setState((prevState) => {
      return { ...prevState, selectedClientId: undefined };
    });
  }, []);

  const handleOwner = useCallback(({ id, messageData: owner, from, isReverted }) => {
    setState((prevState) => ({ ...prevState, owner }));
    document.title = owner.name;
  }, []);

  const handleMap = useMemo(
    () => ({
      owner: handleOwner,
      clients: handleClients,
      "client-connected": handleClientConnected,
      "client-disconnected": handleClientDisconnected,
      photo: handleNewPhoto,
      text: handleNewText,
      "photo-delete": handleDeletePhoto,
      "text-delete": handleDeleteText,
    }),
    [
      handleClients,
      handleOwner,
      handleClientConnected,
      handleClientDisconnected,
      handleNewPhoto,
      handleDeletePhoto,
      handleNewText,
      handleDeleteText,
    ]
  );

  useEffect(() => {
    socket.onopen = () => {
      console.log("Connected to Server");
    };
    socket.onclose = () => {
      alert("Disconnected from Server");
    };
    socket.onmessage = ({ data }) => {
      const { id, type, messageData, from, isReverted } = JSON.parse(data);
      handleMap[type]({ id, messageData, from, isReverted });
    };
  }, [state, socket, handleMap]);

  return (
    <div className="App">
      <Grid container direction="row" justifyContent="space-between" spacing={0}>
        <Grid item xs={4}>
          <List
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
              <ListSubheader component="div" id="nested-list-subheader">
                You
              </ListSubheader>
            }
            className={classes.userList}
          >
            <ListItem key={state.owner.id}>
              <ListItemIcon>
                <Person htmlColor="black" />
              </ListItemIcon>
              <ListItemText primary={`${state.owner.name} - ${state.owner.id}`} />
            </ListItem>
            <Divider />
            <ListSubheader component="div">Active Users</ListSubheader>
            {Object.values(state.clients).map((client) => (
              <ListItem
                button
                key={client.id}
                onClick={() => {
                  handleClientClick(client);
                }}
              >
                <ListItemIcon>
                  <Badge color="secondary" variant="dot" invisible={!("newMessage" in client && client.newMessage)}>
                    <Person htmlColor="green" />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary={client.name} />
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid item xs={8}>
          <Grid
            container
            direction="column"
            alignItems="center"
            justifyContent="space-between"
            spacing={0}
            className={`${classes.imageListGridContainer} image-list-grid-container`}
          >
            <Backdrop className={classes.backdrop} open={!state.selectedClientId}>
              <Button variant="contained" color="primary">
                Select A Client to Start Chat
              </Button>
            </Backdrop>
            <Grid item>
              <ImageList className={classes.imageList}>
                <ImageListItem key="Subheader" cols={2} style={{ height: "auto" }}>
                  <ListSubheader component="div">
                    {state.selectedClientId && state.clients[state.selectedClientId]
                      ? `Chatting with ${state.clients[state.selectedClientId].name} - ${
                          state.clients[state.selectedClientId].id
                        }`
                      : ""}
                  </ListSubheader>
                </ImageListItem>
                {state.selectedClientId &&
                  state.clients[state.selectedClientId] &&
                  Object.values(state.clients[state.selectedClientId].photos).map((item) => (
                    <ImageListItem key={item.id} cols={1}>
                      <img src={item.photoData} alt={item.from} />
                      <ImageListItemBar
                        title={item.id}
                        subtitle={
                          <span>
                            from: {item.isReverted === true ? state.owner.name : state.clients[item.from].name}
                          </span>
                        }
                        actionIcon={
                          <IconButton
                            className={classes.icon}
                            onClick={() => {
                              deletePhoto(item.id);
                            }}
                          >
                            <DeleteForever />
                          </IconButton>
                        }
                      />
                    </ImageListItem>
                  ))}
                {state.selectedClientId &&
                  state.clients[state.selectedClientId] &&
                  Object.values(state.clients[state.selectedClientId].texts).map((item) => (
                    <Card key={item.id} className={classes.card}>
                      <CardContent>
                        <Typography className={classes.title} color="textSecondary" gutterBottom>
                          {item.textData}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <IconButton
                          onClick={() => {
                            deleteText(item.id);
                          }}
                        >
                          <DeleteForever />
                        </IconButton>
                      </CardActions>
                    </Card>
                  ))}
              </ImageList>
            </Grid>
            <Grid
              container
              justifyContent="space-between"
              alignItems="baseline"
              spacing={2}
              className={classes.imageListControlButtons}
            >
              <Grid item>
                {state.selectedImg !== "" && <img width={250} height={250} alt="" src={state.selectedImg} />}
                <input
                  hidden
                  accept="image /*"
                  capture="camcorder"
                  className={classes.fileInput}
                  id="icon-button-video"
                  onChange={handleCapture}
                  type="file"
                />
                <label htmlFor="icon-button-video">
                  <IconButton color="primary" component="span">
                    <AddAPhoto />
                  </IconButton>
                </label>
              </Grid>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  value={textMessage}
                  onKeyDown={(e) => {
                    if (e.code === "Enter") {
                      sendText();
                    }
                  }}
                  onChange={(e) => {
                    setTextMessage(e.target.value);
                  }}
                />
              </Grid>
              <Grid item>
                <IconButton
                  color="primary"
                  component="span"
                  onClick={() => {
                    if (textMessage.length > 0) {
                      sendText();
                    } else {
                      sendPhoto();
                    }
                  }}
                >
                  <Send />
                </IconButton>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
