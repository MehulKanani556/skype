import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sessionStorage from 'redux-persist/es/storage/session';
import axios from 'axios';
import { BASE_URL } from '../../utils/baseUrl';
// import { enqueueSnackbar } from 'notistack';

const handleErrors = (error, dispatch, rejectWithValue) => {
    const errorMessage = error.response?.data?.message || 'An error occurred';

    return rejectWithValue(error.response?.data || { message: errorMessage });
};

const initialState = {
    user: null,
    isAuthenticated: !!sessionStorage.getItem('token') && sessionStorage.getItem('role') === 'admin',
    loading: false,
    error: null,
    loggedIn: false,
    isLoggedOut: false,
    message: null
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/usrLogin`, credentials);
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('userId', response.data.user._id);
            console.log(response.data)
            return response.data;
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/createUser`, userData);
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('userId', response.data.user._id);
            return response.data;
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async (email, { rejectWithValue }) => {
        try {
            console.log(email);
            const response = await axios.post(`${BASE_URL}/forgotPassword`, { email });
            if (response.status === 200) {
                return response.data; // Assuming the API returns a success message
            }
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async ({ email, otp }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/verifyOtp`, { email, otp });
            if (response.status === 200) {
                return response.data; // Assuming the API returns a success message
            }
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async ({ email, newPassword }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/changePassword`, { email, newPassword });
            if (response.status === 200) {
                return response.data; // Assuming the API returns a success message
            }
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

export const googleLogin = createAsyncThunk(
    'auth/google-login',
    async ({ uid, userName, email,photo }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/google-login`, { uid, userName, email ,photo});
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('userId', response.data.user._id);
            return response.data;

        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);



// export const updateUser = createAsyncThunk(
//     'auth/updateUser',
//     async ({ id, values }, { rejectWithValue }) => {
//         const token = await sessionStorage.getItem("token");
//         const formData = new FormData();
//         Object.keys(values).forEach(key => {
//             formData.append(key, values[key]);
//         });
//         try {
//             const response = await axios.put(`${BASE_URL}/editUser/${id}`, formData, {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     'Content-Type': 'multipart/form-data'
//                 }
//             });
//             return response.data; // Assuming the API returns the updated user data
//         } catch (error) {
//             return handleErrors(error, null, rejectWithValue);
//         }
//     }
// );

export const createPlan = createAsyncThunk(
    'auth/createPlan',
    async (planData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/user/plan`, planData);
            return response.data;
        } catch (error) {
            return handleErrors(error, null, rejectWithValue);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
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
                state.error = null;
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
                state.error = null;
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
                state.error = null;
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
          
            // .addCase(updateUser.fulfilled, (state, action) => {
            //     state.user = action.payload.users; // Assuming the API returns the updated user data
            //     state.loading = false;
            //     state.error = null;
            //     state.message = "User updated successfully";
            //     // enqueueSnackbar(state.message, { variant: 'success' });
            // })
            // .addCase(updateUser.rejected, (state, action) => {
            //     state.loading = false;
            //     state.error = action.payload.message;
            //     state.message = action.payload?.message || "Failed to update user";
            //     // enqueueSnackbar(state.message, { variant: 'error' });
            // })
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
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
