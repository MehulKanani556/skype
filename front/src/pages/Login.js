import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { GoogleLogin } from '@react-oauth/google';
import { forgotPassword, googleLogin, login, register, resetPassword, verifyOtp } from '../redux/slice/auth.slice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { LuEye, LuEyeClosed } from 'react-icons/lu';
import { ImCross } from 'react-icons/im';
import { BiSolidErrorAlt } from "react-icons/bi";
const OTPInput = ({ length = 4, onComplete, resendTimer, setResendTimer, handleVerifyOTP, handleBack, email }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    const otpValue = newOtp.join('');
    if (otpValue.length === length) {
      onComplete?.(otpValue);
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);

    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      pastedData.split('').forEach((digit, index) => {
        if (index < length) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);

      if (pastedData.length === length) {
        onComplete?.(pastedData);
      }
      // Focus last filled input or first empty input
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== length) {
      setError('Please enter the complete OTP.');
      return;
    }
    setError('');
    try {
      const response = await dispatch(verifyOtp({ email: email, otp: otpValue }));
      console.log(response);
      if (response.payload.status === 200) {
        handleVerifyOTP(otpValue);
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } catch (error) {
      setError('Error verifying OTP. Please try again.');
    }
  };

  return (
    <div className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-6">
      <h1 className="text-2xl font-bold mb-6">Enter OTP</h1>
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="flex justify-center space-x-2 pb-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(ref) => inputRefs.current[index] = ref}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className="w-10 h-10 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1}
            />
          ))}
        </div>
        {error && <div className="text-red-500 text-center text-sm mt-1">{error}</div>}
        {/* <div className="text-sm text-gray-500 mt-4 w-full text-center">
          Didn't receive code?
          <button
            type="button"
            onClick={() => setResendTimer(60)}
            disabled={resendTimer > 0}
            className="text-blue-500 hover:text-blue-600 ml-1"
          >
            Resend {resendTimer > 0 ? `(${resendTimer}s)` : ''}
          </button>
        </div> */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-600 transition-colors"
        >
          Verify
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="w-full bg-gray-300 text-black rounded-lg py-2.5 font-semibold hover:bg-gray-400 transition-colors mt-2"
        >
          Back
        </button>
      </form>
    </div>
  );
};

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);
  const [resendTimer, setResendTimer] = useState(60);
  const [email, setEmail] = useState('');
  const { message, error } = useSelector((state) => state.auth);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (message && error != null) {
      setModalVisible(true)
    }
    else {
      setModalVisible(false)
    }
  }, [message])
console.log("success", error)
  useEffect(() => {
    if (modalVisible) {
      const timer = setTimeout(() => {
        setModalVisible(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [modalVisible]);


  const togglePanel = () => {
    setForgotPasswordStep(0);
    setIsRightPanelActive(!isRightPanelActive);
  };

  const signUpSchema = Yup.object().shape({
    userName: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const signInSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const FormContainer = ({ children, isSignUp }) => (
    <div
      className={`absolute top-0 h-full transition-all duration-500 ease-in-out
      ${isMobile
          ? `w-full ${isRightPanelActive
            ? isSignUp
              ? "translate-x-0"
              : "translate-x-full"
            : isSignUp
              ? "translate-x-full"
              : "translate-x-0"
          }`
          : `w-1/2 ${isRightPanelActive
            ? isSignUp
              ? "translate-x-full opacity-100 z-50"
              : "translate-x-0 opacity-0"
            : isSignUp
              ? "opacity-0"
              : "opacity-100 z-50"
          }`
        }`}
    >
      {children}
    </div>
  );

  const handleForgotPassword = () => {
    setForgotPasswordStep(1);
  };

  const handleSendOTP = () => {
    // Logic to send OTP
    setForgotPasswordStep(2);
    setIsRightPanelActive(!isRightPanelActive);
  };

  const handleVerifyOTP = () => {
    setForgotPasswordStep(3);

  };


  const handleChangePassword = (values) => {
    console.log(values);
    const { newPassword } = values; // Extract newPassword from values
    dispatch(resetPassword({ newPassword, email })).then((response) => {
      console.log(response)
      if (response.payload.status == 200) {
        setForgotPasswordStep(0);
        setIsRightPanelActive(!isRightPanelActive);
      }
    });
  };

  const handleBack = () => {
    setForgotPasswordStep(forgotPasswordStep - 1);
    if (forgotPasswordStep === 2) {
      setIsRightPanelActive(!isRightPanelActive);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl relative overflow-hidden w-full max-w-4xl min-h-[620px] md:min-h-[480px]
        ${isRightPanelActive ? 'right-panel-active' : ''}`}>

        {/* Sign Up Form */}
        <FormContainer isSignUp={true}>
          {forgotPasswordStep === 0 && (
            <Formik
              initialValues={{ userName: '', email: '', password: '' }}
              validationSchema={signUpSchema}

              onSubmit={(values) => {
                dispatch(register(values)).then((response) => {
                  if (response.payload) navigate('/chat');
                });
              }}
            >
              {({ values, errors, touched, handleChange }) => (
                <Form className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-8">
                  <h1 className="text-2xl font-bold mb-6">Create Account</h1>

                  <div className="w-full space-y-4">
                    <div>
                      <Field
                        type="text"
                        name="userName"
                        placeholder="User Name"
                        value={values.userName}
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <ErrorMessage name="userName" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <Field
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={values.email}
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <Field
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={values.password}
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Sign Up
                    </button>
                  </div>

                  <div className="w-full mt-6">
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <GoogleLogin
                      onSuccess={response => {
                        const { name, email, sub: uid } = jwtDecode(response.credential);
                        dispatch(googleLogin({ uid, userName: name, email })).then((response) => {
                          if (response.payload) navigate('/chat');
                        });
                      }}
                      onFailure={console.error}
                      render={renderProps => (
                        <button
                          onClick={renderProps.onClick}
                          disabled={renderProps.disabled}
                          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <img src={require('../assets/google-logo.png')} alt="Google" className="w-5 h-5" />
                          <span>Continue with Google</span>
                        </button>
                      )}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          )}
          {forgotPasswordStep === 2 && (
            <OTPInput
              length={4}
              onComplete={(otpValue) => {

              }}
              resendTimer={resendTimer}
              setResendTimer={setResendTimer}
              handleVerifyOTP={handleVerifyOTP}
              handleBack={handleBack}
              email={email}

            />
          )}
          {forgotPasswordStep === 3 && (
            <Formik
              initialValues={{
                newPassword: '',
                confirmPassword: '',
                showNewPassword: false,
                showConfirmPassword: false
              }}
              validationSchema={Yup.object({
                newPassword: Yup.string()
                  .min(6, 'Password must be at least 6 characters')
                  .required('New Password is required'),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
                  .required('Confirm Password is required'),
              })}
              onSubmit={(values) => {
                const { newPassword, confirmPassword } = values;
                handleChangePassword({ newPassword, confirmPassword });
              }}
            >
              {({ values, setFieldValue, handleChange, handleSubmit, errors, touched }) => (
                <form onSubmit={handleSubmit} className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-6">
                  <h1 className="text-2xl font-bold mb-6">Change Password</h1>
                  <div className="w-full space-y-4">
                    <div className="relative">
                      <input
                        type={values.showNewPassword ? "text" : "password"}
                        name="newPassword"
                        placeholder="New Password"
                        value={values.newPassword}
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div
                        className="absolute right-3 top-3 cursor-pointer select-none text-blue-500"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFieldValue('showNewPassword', !values.showNewPassword);
                        }}
                      >
                        {values.showNewPassword ? <LuEye /> : <LuEyeClosed />}
                      </div>
                      {errors.newPassword && touched.newPassword && (
                        <div className="text-red-500 text-sm mt-1">{errors.newPassword}</div>
                      )}
                    </div>
                    <div className="relative pb-3">
                      <input
                        type={values.showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div
                        className="absolute right-3 top-3 cursor-pointer select-none text-blue-500"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFieldValue('showConfirmPassword', !values.showConfirmPassword);
                        }}
                      >
                        {values.showConfirmPassword ? <LuEye /> : <LuEyeClosed />}
                      </div>
                      {errors.confirmPassword && touched.confirmPassword && (
                        <div className="text-red-500 text-sm mt-1">{errors.confirmPassword}</div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full bg-gray-300 text-black rounded-lg py-2.5 font-semibold hover:bg-gray-400 transition-colors mt-2"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          )}
        </FormContainer>


        {/* Sign In Form */}
        <FormContainer isSignUp={false}>
          {forgotPasswordStep === 0 && (
            <Formik
              initialValues={{ email: '', password: '', showPassword: false }}
              validationSchema={signInSchema}
              onSubmit={(values) => {
                dispatch(login(values)).then((response) => {

                  if (response.payload.status == 200) navigate('/chat');
                });
              }}
            >
              {({ values, errors, touched, handleChange, setFieldValue }) => (
                <Form className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-6">
                  <h1 className="text-2xl font-bold mb-6">Sign In</h1>
                  <div className="w-full space-y-4">
                    <div>
                      <Field
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={values.email}
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="relative">
                      <Field
                        type={values.showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={values.password}
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div
                        className="absolute right-3 top-3 cursor-pointer select-none text-blue-500"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFieldValue('showPassword', !values.showPassword);
                        }}
                      >
                        {values.showPassword ? <LuEye /> : <LuEyeClosed />}
                      </div>
                      <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="flex justify-end">
                      <a href="#" onClick={handleForgotPassword} className="text-sm text-blue-500 hover:text-blue-600">Forgot password?</a>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Sign In
                    </button>
                  </div>

                  <div className="w-full mt-6">
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <GoogleLogin
                      onSuccess={response => {
                        const { name, email, sub: uid, picture: photo } = jwtDecode(response.credential);
                        console.log(jwtDecode(response.credential))
                        dispatch(googleLogin({ uid, userName: name, email })).then((response) => {
                          if (response.payload) navigate('/chat');
                        });

                      }}
                      onFailure={console.error}
                      render={renderProps => (
                        <button
                          onClick={renderProps.onClick}
                          disabled={renderProps.disabled}
                          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <img src={require('../assets/google-logo.png')} alt="Google" className="w-5 h-5" />
                          <span className='text-right flex-grow-0'>Continue with Google</span>
                        </button>
                      )}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {forgotPasswordStep === 1 && (
            <Formik
              initialValues={{ email: '' }}
              validationSchema={Yup.object({
                email: Yup.string().email('Invalid email').required('Email is required'),
              })}
              onSubmit={(values, { resetForm }) => {
                // Logic to handle form submission
                console.log(values.email);
                setEmail(values.email);
                dispatch(forgotPassword(values.email)).then((response) => {
                  console.log(response);
                  if (response.payload.success) {
                    handleSendOTP();
                    resetForm(); // Clear the form on success
                  }
                });
              }}
            >
              {({ handleChange, handleSubmit }) => (
                <form onSubmit={handleSubmit} className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-6">
                  <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
                  <div className="w-full space-y-4">
                    <div className='pb-3'>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ref={(input) => input && input.focus()}
                      />
                      <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Send OTP
                    </button>
                    <button
                      onClick={handleBack}
                      className="w-full bg-gray-300 text-black rounded-lg py-2.5 font-semibold hover:bg-gray-400 transition-colors mt-2"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          )}
        </FormContainer>

        {/* Overlay Container */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-500 ease-in-out z-50
          ${isMobile ? 'hidden' : `${isRightPanelActive ? '-translate-x-full' : ''}`}`}>
          <div className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white relative -left-full h-full w-[200%] transform 
            ${isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'} transition-transform duration-500 ease-in-out`}>

            {/* Left Overlay Panel */}
            <div
              className={`absolute top-0 flex flex-col items-center justify-center px-8 md:px-10 text-center h-full w-1/2 transition-transform duration-500 ease-in-out
              ${isRightPanelActive ? "translate-x-0" : "-translate-x-[20%]"}`}
            >
              <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="mb-6">
                Sign in with your personal info to stay connected with us
              </p>
              <button
                onClick={togglePanel}
                className="border-2 border-white px-8 py-2 rounded-full font-semibold hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
            </div>

            {/* Right Overlay Panel */}
            <div
              className={`absolute top-0 right-0 flex flex-col items-center justify-center px-8 md:px-10 text-center h-full w-1/2 transition-transform duration-500 ease-in-out
              ${isRightPanelActive ? "translate-x-[20%]" : "translate-x-0"}`}
            >
              <h1 className="text-3xl font-bold mb-4">Hello, Friend!</h1>
              <p className="mb-6">
                Begin your journey with us by entering your personal details
              </p>
              <button
                onClick={togglePanel}
                className="border-2 border-white px-8 py-2 rounded-full font-semibold hover:bg-white/10 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Toggle */}
        {isMobile && (
          <div className="absolute -bottom-3 left-0 right-0  p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
            <p className="mb-3">
              {isRightPanelActive
                ? "Already have an account?"
                : "Don't have an account?"}
            </p>
            <button
              onClick={togglePanel}
              className="border-2 border-white px-8 py-2 rounded-full font-semibold hover:bg-white/10 transition-colors mb-[10px]"
            >
              {isRightPanelActive ? "Sign In" : "Sign Up"}
            </button>
          </div>
        )}
        {/* error message  */}
        {modalVisible && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setModalVisible(false)}
          >
            <div
              className="bg-white rounded-lg w-96 "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end items-center pb-2 p-4">

                <button
                  onClick={() => setModalVisible(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ImCross />
                </button>
              </div>
              <div className='text-xl p-5 text-red-500 py-8 pt-6 text-center flex flex-col justify-center items-center'>
                <p className='text-center text-6xl mb-3'>
                  <BiSolidErrorAlt />
                </p>
                <p>
                  {typeof message === 'object' ? message.message : message}
                </p>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
