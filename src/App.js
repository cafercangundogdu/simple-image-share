import React, { useState, useContext, useEffect } from "react";
import {
  Badge,
  Button,
  Grid,
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
}));

export default function App() {
  const classes = useStyles();

  const socket = useContext(SocketContext);

  const [state, setState] = useState({
    clients: {},
    owner: {},
    photos: {},
    selectedImg: "",
    selectedClientId: undefined,
  });

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

    handleDeletePhoto(photoId, state.selectedClientId);
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
  const handleNewPhoto = (id, photoData, from, isReverted) => {
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
  };

  /**
   * Deletes the received photo from the client from state
   * @param id
   * @param from
   */
  const handleDeletePhoto = (id, from) => {
    setState((prevState) => {
      const photos = prevState.clients[from].photos;
      delete photos[id];
      return { ...prevState, photos };
    });
  };

  /**
   * Assigns the clients to state
   * @param _clients
   */
  const handleClients = (_clients) => {
    let clients = _clients.reduce((o, c) => ((o[c["id"]] = c), o), {});
    setState((prevState) => ({ ...prevState, clients }));
  };

  /**
   * Assigns the connected client to state
   * @param client
   */
  const handleClientConnected = (client) => {
    setState((prevState) => {
      const clients = prevState.clients;
      clients[client.id] = client;
      return { ...prevState, clients };
    });
  };

  /**
   * Deletes the disconnected client from state
   * @param client
   */
  const handleClientDisconnected = (client) => {
    setState((prevState) => {
      const clients = prevState.clients;
      delete clients[client.id];
      return { ...prevState, clients };
    });
    setState((prevState) => {
      return { ...prevState, selectedClientId: undefined };
    });
  };

  useEffect(() => {
    socket.onopen = () => {
      console.log("Connected to Server");
    };
    socket.onclose = () => {
      alert("Disconnected from Server");
    };
    socket.onmessage = ({ data }) => {
      const { id, type, messageData, from, isReverted } = JSON.parse(data);
      if (type === "owner") {
        setState((prevState) => ({ ...prevState, owner: messageData }));
        document.title = messageData.name;
      } else if (type === "clients") {
        handleClients(messageData);
      } else if (type === "client-connected") {
        handleClientConnected(messageData);
      } else if (type === "client-disconnected") {
        handleClientDisconnected(messageData);
      } else if (type === "photo") {
        handleNewPhoto(id, messageData, from, isReverted);
      } else if (type === "photo-delete") {
        handleDeletePhoto(messageData, from);
      }
    };
  }, [state, socket]);

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
              <Grid item>
                <IconButton color="primary" component="span" onClick={sendPhoto}>
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
