import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import sessionStorage from "redux-persist/es/storage/session";
import axios from "axios";
import { BASE_URL } from "../../utils/baseUrl";
// import { Socket } from "socket.io-client";
// import { enqueueSnackbar } from 'notistack';



const handleErrors = (error, dispatch, rejectWithValue) => {
  const errorMessage = error.response?.data?.message || "An error occurred";

  return rejectWithValue(error.response?.data || { message: errorMessage });
};

const initialState = {
  user: null,
  allCallUsers:[],
  onlineUser: [],
  allUsers: [],
  allMessageUsers: [],
  messages: [],
  groups: [],
  isAuthenticated:
    !!sessionStorage.getItem("token") &&
    sessionStorage.getItem("role") === "admin",
  loading: false,
  error: null,
  loggedIn: false,
  isLoggedOut: false,
  message: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/usrLogin`, credentials);
      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("userId", response.data.user._id);
      console.log(response.data);
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/createUser`, userData);
      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("userId", response.data.user._id);
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/user/reset-mail`, {
        email,
      });
      if (response.status === 200) {
        return response.data; // Assuming the API returns a success message
      }
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/user/verify-otp`, {
        email,
        otp,
      });
      if (response.status === 200) {
        return response.data; // Assuming the API returns a success message
      }
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/user/new-password`, {
        email,
        password,
      });
      if (response.status === 200) {
        return response.data.message; // Assuming the API returns a success message
      }
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/google-login",
  async ({ uid, name, email }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/google-login`, {
        uid,
        name,
        email,
      });
      console.log(response.data.user);
      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("userId", response.data.user._id);
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);
export const getUser = createAsyncThunk(
  "auth/getUser",
  async (userId, { rejectWithValue }) => {
    try {
      const token = await sessionStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/singleUser/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data; // Assuming the API returns the user data
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

// export const updateUser = createAsyncThunk(
//     'auth/updateUser',
//     async ({ id, values }, { rejectWithValue }) => {
//         console.log(values);
//         try {
//             const response = await axios.post(`${BASE_URL}/user/${id}`, values);
//             return response.data; // Assuming the API returns the updated user data
//         } catch (error) {
//             return handleErrors(error, null, rejectWithValue);
//         }
//     }
// );

export const createPlan = createAsyncThunk(
  "auth/createPlan",
  async (planData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/user/plan`, planData);
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = await sessionStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/allUsers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.users;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const getAllMessageUsers = createAsyncThunk(
  "user/getAllMessageUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = await sessionStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/allMessageUsers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.users;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);
export const getAllCallUsers = createAsyncThunk(
  "user/getAllCallUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = await sessionStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/allCallUsers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.users;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

// export const getOnlineUsers = createAsyncThunk(
//     'user/getOnlineUsers',
//     async (_, { rejectWithValue }) => {
//         try {
//             const token = await sessionStorage.getItem("token");
//             const response = await axios.get(`${BASE_URL}/online-users`,{
//                 headers:{
//                     Authorization: `Bearer ${token}`
//                 }
//             });
//             return response.data;
//         } catch (error) {
//             return handleErrors(error, null, rejectWithValue);
//         }
//     }
// );

export const getAllMessages = createAsyncThunk(
  "user/getAllMessages",
  async ({ selectedId }, { rejectWithValue }) => {
    try {
      console.log(selectedId);
      const token = await sessionStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/allMessages`,
        { selectedId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.messages;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "user/deleteMessage",
  async (messageId, { rejectWithValue }) => {
    try {
      const token = await sessionStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/deleteMessage/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const updateMessage = createAsyncThunk(
  "user/updateMessage",
  async ({ messageId, content }, { rejectWithValue }) => {
    try {
      const token = await sessionStorage.getItem("token");
      const response = await axios.put(
        `${BASE_URL}/updateMessage/${messageId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async ({ id, values }, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      formData.append(key, values[key]);
    });
    try {
      const response = await axios.put(`${BASE_URL}/editUser/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data; // Assuming the API returns the updated user data
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const createGroup = createAsyncThunk(
  "user/createGroup",
  async ({groupData, socket}, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");
    const formData = new FormData();
    Object.keys(groupData).forEach((key) => {
      if (Array.isArray(groupData[key])) {
        groupData[key].forEach((member) => {
          formData.append(`${key}[]`, member); // Append each member in the array
        });
      } else {
        formData.append(key, groupData[key]);
      }
    });
    try {
      const response = await axios.post(`${BASE_URL}/createGroup`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("response", response.data);
      // Emit socket event for group creation
      if (socket) {
        console.log("socket", socket);
        socket.emit("create-group", response.data.group);
      }
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const getAllGroups = createAsyncThunk(
  "user/getAllGroups",
  async (_, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");
    const response = await axios.get(`${BASE_URL}/allGroups`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
);

export const updateGroup = createAsyncThunk(
  "user/updateGroup",
  async (groupData, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");
    const { groupId, userName, members, photo } = groupData;
    const formData = new FormData();
    formData.append("groupId", groupId);
    if (userName) {
      formData.append("userName", userName);
    }
    if (photo) {
      formData.append("photo", photo);
    }
    if (members) {
      members.forEach((member) => {
        formData.append("members[]", member);
      });
    }

    try {
      const response = await axios.put(
        `${BASE_URL}/updateGroup/${groupId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const deleteGroup = createAsyncThunk(
  "user/deleteGroup",
  async (groupId, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");
    try {
      const response = await axios.delete(
        `${BASE_URL}/deleteGroup/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const addParticipants = createAsyncThunk(
  "user/addParticipants",
  async ({ groupId, members, addedBy }, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");  
    try {
      const response = await axios.post(`${BASE_URL}/addParticipants`, { groupId, members, addedBy }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }); 
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);



export const leaveGroup = createAsyncThunk(
  "user/leaveGroup",
  async ({ groupId, userId, removeId }, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");
    try {
      const response = await axios.post(
        `${BASE_URL}/leaveGroup`,
        { groupId, userId, removeId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);
export const getOnlineUsers = createAsyncThunk(
  "user/getOnlineUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = await sessionStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/online-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const clearChat = createAsyncThunk(
  "user/clearChat",
  async ({ selectedId }, { rejectWithValue }) => {
    try {
      const token = await sessionStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/clearChat`,
        { selectedId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state, action) => {
      state.user = null;
      state.allCallUsers = null;
      state.isAuthenticated = false;
      state.loggedIn = false;
      state.isLoggedOut = true;
      state.message = action.payload?.message || "Logged out successfully";
      window.localStorage.clear();
      window.sessionStorage.clear();
    },
    setOnlineuser: (state, action) => {
      state.onlineUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.message = action.payload?.message || "Login successfully";
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Login Failed";
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.message = action.payload?.message || "Register successfully";
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "User Already Exist";
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload; // Assuming the API returns a success message
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Forgot Password Failed";
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message; // Assuming the API returns a success message
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload.data?.message || "Verify OTP Failed";
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload; // Assuming the API returns a success message
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Reset Password Failed";
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.message = action.payload?.message || "Google Login successful";
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Google Login Failed";
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.user = action.payload.users; // Assuming the API returns the user data
        state.loading = false;
        state.error = null;
        state.message = "User retrieved successfully";
      })
      .addCase(getUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to retrieve user";
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload.users; // Assuming the API returns the updated user data
        state.loading = false;
        state.error = null;
        state.message = "User updated successfully";
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to update user";
      })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = action.payload?.message || "Plan created successfully";
      })
      .addCase(createPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to create plan";
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.allUsers = action.payload;
        state.loading = false;
        state.error = null;
        state.message = "Users retrieved successfully";
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to retrieve users";
      })
      .addCase(getOnlineUsers.fulfilled, (state, action) => {
        state.onlineUser = action.payload;
        state.loading = false;
        state.error = null;
        state.message = "Online users retrieved successfully";
      })
      .addCase(getOnlineUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to retrieve online users";
      })
      .addCase(getAllMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
        state.loading = false;
        state.error = null;
        state.message = "Messages retrieved successfully";
      })
      .addCase(getAllMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to retrieve messages";
      })
      .addCase(getAllMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = "Retrieving messages...";
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = action.payload?.message || "Message deleted successfully";
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to delete message";
      })
      .addCase(updateMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = "Message updated successfully";
      })
      .addCase(updateMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to update message";
      })
      .addCase(getAllMessageUsers.fulfilled, (state, action) => {
        state.allMessageUsers = action.payload;
        state.loading = false;
        state.error = null;
        state.message = "Message users retrieved successfully";
      })
      .addCase(getAllMessageUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to retrieve message users";
      })
      .addCase(getAllGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
        state.loading = false;
        state.error = null;
        state.message = "Groups retrieved successfully";
      })
      .addCase(getAllGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.message = action.payload?.message || "Failed to retrieve groups";
      })
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = "Group created successfully";
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.message = action.payload?.message || "Failed to create group";
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = "Group updated successfully";
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.message = action.payload?.message || "Failed to update group";
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = "Group left successfully";
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.message = action.payload?.message || "Failed to leave group";
      })
      .addCase(clearChat.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = "Chat cleared successfully";
      })
      .addCase(clearChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to clear chat";
      })
      .addCase(getAllCallUsers.fulfilled, (state, action) => {
        state.allCallUsers = action.payload; // Assuming the API returns the call users
        state.loading = false;
        state.error = null;
        state.message = "Call users retrieved successfully";
      })
      .addCase(getAllCallUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to retrieve call users";
      });
  },
});

export const { logout, setOnlineuser } = userSlice.actions;
export default userSlice.reducer;
