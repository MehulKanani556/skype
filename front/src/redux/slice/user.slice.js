import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import sessionStorage from "redux-persist/es/storage/session";
import axios from "axios";
import { BASE_URL } from "../../utils/baseUrl";
// import { enqueueSnackbar } from 'notistack';

const handleErrors = (error, dispatch, rejectWithValue) => {
  const errorMessage = error.response?.data?.message || "An error occurred";

  return rejectWithValue(error.response?.data || { message: errorMessage });
};

const initialState = {
  user: null,
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
  'auth/getUser',
  async (userId, { rejectWithValue }) => {
    try {
      const token = await sessionStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/singleUser/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
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
      console.log(response.data);
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
  'auth/updateUser',
  async ({ id, values }, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");
    const formData = new FormData();
    Object.keys(values).forEach(key => {
      formData.append(key, values[key]);
    });
    try {
      const response = await axios.put(`${BASE_URL}/editUser/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data; // Assuming the API returns the updated user data
    } catch (error) {
      return handleErrors(error, null, rejectWithValue);
    }
  }
);

export const createGroup = createAsyncThunk(
  "user/createGroup",
  async (groupData, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");
    try {
      const response = await axios.post(`${BASE_URL}/createGroup`, groupData, {
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
    const { groupId, name, members } = groupData;
    try {
      const response = await axios.put(
        `${BASE_URL}/updateGroup/${groupId}`,
        groupData,
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

export const leaveGroup = createAsyncThunk(
  "user/leaveGroup",
  async ({ groupId, userId }, { rejectWithValue }) => {
    const token = await sessionStorage.getItem("token");
    try {
      const response = await axios.post(
        `${BASE_URL}/leaveGroup`,
        { groupId, userId },
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
    'user/getOnlineUsers',
    async (_, { rejectWithValue }) => {
        try {
            const token = await sessionStorage.getItem("token");
            const response = await axios.get(`${BASE_URL}/online-users`,{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            });
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
      state.isAuthenticated = false;
      state.loggedIn = false;
      state.isLoggedOut = true;
      state.message = action.payload?.message || "Logged out successfully";
      window.localStorage.clear();
      window.sessionStorage.clear();

    },
    extraReducers: (builder) => {
      builder
        .addCase(login.fulfilled, (state, action) => {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.loading = false;
          state.error = null;
          state.message = action.payload?.message || "Login successfully";
          // if (action.payload?.message) {
          //     enqueueSnackbar(action.payload?.message, { variant: 'success' });
          // }
        })
        .addCase(login.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload.message;
          state.message = action.payload?.message || "Login Failed";
          // enqueueSnackbar(state.message, { variant: 'error' });

        })
        .addCase(register.fulfilled, (state, action) => {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.loading = false;
          state.error = null;
          state.message = action.payload?.message || "Register successfully";
          // if (action.payload?.message) {
          //     enqueueSnackbar(action.payload?.message, { variant: 'success' });
          // }
        })
        .addCase(register.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload.message;
          state.message = action.payload?.message || "User Already Exist";
          // enqueueSnackbar(state.message, { variant: 'error' });
        })
        .addCase(forgotPassword.fulfilled, (state, action) => {
          state.loading = false;
          state.message = action.payload; // Assuming the API returns a success message
          // enqueueSnackbar(state.message, { variant: 'success' });
        })
        .addCase(forgotPassword.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload.message;
          state.message = action.payload?.message || "Forgot Password Failed";
          // enqueueSnackbar(state.message, { variant: 'error' });
        })
        .addCase(verifyOtp.fulfilled, (state, action) => {
          state.loading = false;
          state.message = action.payload.message; // Assuming the API returns a success message
          // enqueueSnackbar(state.message, { variant: 'success' });
        })
        .addCase(verifyOtp.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload.message;
          state.message = action.payload.data?.message || "Verify OTP Failed";
          // enqueueSnackbar(state.message, { variant: 'error' });
        })
        .addCase(resetPassword.fulfilled, (state, action) => {
          state.loading = false;
          state.message = action.payload; // Assuming the API returns a success message
          // enqueueSnackbar(state.message, { variant: 'success' });
        })
        .addCase(resetPassword.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload.message;
          state.message = action.payload?.message || "Reset Password Failed";
          // enqueueSnackbar(state.message, { variant: 'error' });
        })
        .addCase(googleLogin.fulfilled, (state, action) => {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.loading = false;
          state.error = null;
          state.message = action.payload?.message || "Google Login successful";
          // if (action.payload?.message) {
          //     enqueueSnackbar(action.payload?.message, { variant: 'success' });
          // }
        })
        .addCase(googleLogin.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload.message;
          state.message = action.payload?.message || "Google Login Failed";
          // enqueueSnackbar(state.message, { variant: 'error' });
        })
        .addCase(getUser.fulfilled, (state, action) => {

          state.user = action.payload.users; // Assuming the API returns the user data
          state.loading = false;
          state.error = null;
          state.message = "User retrieved successfully";
          // enqueueSnackbar(state.message, { variant: 'success' });
        })
        .addCase(getUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload.message;
          state.message = action.payload?.message || "Failed to retrieve user";
          // enqueueSnackbar(state.message, { variant: 'error' });
        })
        .addCase(updateUser.fulfilled, (state, action) => {
          state.user = action.payload.users; // Assuming the API returns the updated user data
          state.loading = false;
          state.error = null;
          state.message = "User updated successfully";
          // enqueueSnackbar(state.message, { variant: 'success' });
        })
        .addCase(updateUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload.message;
          state.message = action.payload?.message || "Failed to update user";
          // enqueueSnackbar(state.message, { variant: 'error' });
        })
        .addCase(createPlan.fulfilled, (state, action) => {
          state.loading = false;
          state.error = null;
          state.message = action.payload?.message || "Plan created successfully";
          // enqueueSnackbar(state.message, { variant: 'success' });
        })
        .addCase(createPlan.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload.message;
          state.message = action.payload?.message || "Failed to create plan";
          // enqueueSnackbar(state.message, { variant: 'error' });
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
        .addCase(getAllMessages.pending, (state, action) => {
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
        // if (action.payload?.message) {
        //     enqueueSnackbar(action.payload?.message, { variant: 'success' });
        // }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Login Failed";
        // enqueueSnackbar(state.message, { variant: 'error' });
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.message = action.payload?.message || "Register successfully";
        // if (action.payload?.message) {
        //     enqueueSnackbar(action.payload?.message, { variant: 'success' });
        // }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "User Already Exist";
        // enqueueSnackbar(state.message, { variant: 'error' });
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload; // Assuming the API returns a success message
        // enqueueSnackbar(state.message, { variant: 'success' });
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Forgot Password Failed";
        // enqueueSnackbar(state.message, { variant: 'error' });
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message; // Assuming the API returns a success message
        // enqueueSnackbar(state.message, { variant: 'success' });
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload.data?.message || "Verify OTP Failed";
        // enqueueSnackbar(state.message, { variant: 'error' });
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload; // Assuming the API returns a success message
        // enqueueSnackbar(state.message, { variant: 'success' });
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Reset Password Failed";
        // enqueueSnackbar(state.message, { variant: 'error' });
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.message = action.payload?.message || "Google Login successful";
        // if (action.payload?.message) {
        //     enqueueSnackbar(action.payload?.message, { variant: 'success' });
        // }
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Google Login Failed";
        // enqueueSnackbar(state.message, { variant: 'error' });
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.user = action.payload.data; // Assuming the API returns the user data
        state.loading = false;
        state.error = null;
        state.message = "User retrieved successfully";
        // enqueueSnackbar(state.message, { variant: 'success' });
      })
      .addCase(getUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to retrieve user";
        // enqueueSnackbar(state.message, { variant: 'error' });
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload.data; // Assuming the API returns the updated user data
        state.loading = false;
        state.error = null;
        state.message = "User updated successfully";
        // enqueueSnackbar(state.message, { variant: 'success' });
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to update user";
        // enqueueSnackbar(state.message, { variant: 'error' });
      })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = action.payload?.message || "Plan created successfully";
        // enqueueSnackbar(state.message, { variant: 'success' });
      })
      .addCase(createPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message = action.payload?.message || "Failed to create plan";
        // enqueueSnackbar(state.message, { variant: 'error' });
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
      // .addCase(getOnlineUsers.fulfilled, (state, action) => {
      //     // state.onlineUser = action.payload;
      //     state.loading = false;
      //     state.error = null;
      //     state.message = "Online users retrieved successfully";
      // })
      // .addCase(getOnlineUsers.rejected, (state, action) => {
      //     state.loading = false;
      //     state.error = action.payload.message;
      //     state.message = action.payload?.message || "Failed to retrieve online users";
      // })
      .addCase(getAllMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
        state.loading = false;
        state.error = null;
        state.message = "Messages retrieved successfully";
      })
      .addCase(getAllMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.message =
          action.payload?.message || "Failed to retrieve messages";
      })
      .addCase(getAllMessages.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.message = "Retrieving messages...";
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message =
          action.payload?.message || "Message deleted successfully";
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
        state.message =
          action.payload?.message || "Failed to retrieve message users";
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
      });
  },
});

export const { logout, setOnlineuser } = userSlice.actions;
export default userSlice.reducer;
