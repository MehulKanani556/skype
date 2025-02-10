import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { GoogleLogin } from '@react-oauth/google';
import { forgotPassword, googleLogin, login, register, resetPassword, verifyOtp } from '../redux/slice/auth.slice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";

const OTPInput = ({ length = 4, onComplete, resendTimer, setResendTimer, handleVerifyOTP, handleBack }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);
  const dispatch = useDispatch();  // Add this line to get dispatch

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last entered digit
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // If value is entered, move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // If all digits are entered, call onComplete
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
    if (otpValue.length === length) {
      // alert('Verifying OTP...');
      try {
        const response = await dispatch(verifyOtp(otpValue));
        if (response.payload) {
          // alert('OTP verified successfully!');
          handleVerifyOTP(otpValue); // This will handle the state change for showing the change password form
        } else {
          // alert('OTP verification failed. Please try again.');
        }
      } catch (error) {
        alert('Error verifying OTP. Please try again.');
      }
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
        <div className="text-sm text-gray-500 mt-4 w-full text-center">
          Didn't receive code?
          <button
            type="button"
            onClick={() => setResendTimer(60)}
            disabled={resendTimer > 0}
            className="text-blue-500 hover:text-blue-600 ml-1"
          >
            Resend {resendTimer > 0 ? `(${resendTimer}s)` : ''}
          </button>
        </div>
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
  const timerRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // useEffect(() => {
  //   if (resendTimer > 0) {
  //     timerRef.current = setInterval(() => {
  //       setResendTimer(prevTimer => prevTimer - 1);
  //     }, 1000);
  //   } else if (timerRef.current) {
  //     clearInterval(timerRef.current);
  //   }
  //   return () => clearInterval(timerRef.current);
  // }, [resendTimer]);

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
    dispatch(resetPassword(values)).then((response) => {
      if (response.payload) {
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
                  if (response.payload) navigate('/');
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
                          if (response.payload) navigate('/');
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

            />
          )}
           {forgotPasswordStep === 3 && (
            <Formik
              initialValues={{ newPassword: '', confirmPassword: '' }}
              validationSchema={Yup.object({
                newPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('New Password is required'),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
                  .required('Confirm Password is required'),
              })}
              onSubmit={(values) => {
                // Logic to handle password change
                handleChangePassword(values);
              }}
            >
              {({ values, handleChange, handleSubmit, errors, touched }) => (
                <form onSubmit={handleSubmit} className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-6">
                  <h1 className="text-2xl font-bold mb-6">Change Password</h1>
                  <div className="w-full space-y-4">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        placeholder="New Password"
                        value={values.newPassword}
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 cursor-pointer"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </span>
                      {errors.newPassword && touched.newPassword && (
                        <div className="text-red-500 text-sm mt-1">{errors.newPassword}</div>
                      )}
                    </div>
                    <div className="relative pb-3">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 cursor-pointer"
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </span>
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
              initialValues={{ email: '', password: '' }}
              validationSchema={signInSchema}
              onSubmit={(values) => {
                dispatch(login(values)).then((response) => {
                  if (response.payload) navigate('/');
                });
              }}
            >
              {({ values, errors, touched, handleChange }) => (
                <Form className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-6">
                  <h1 className="text-2xl font-bold mb-6">Sign In</h1>
                  {console.log(values)}

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
                        const { name, email, sub: uid } = jwtDecode(response.credential);

                        dispatch(googleLogin({ uid, userName: name, email })).then((response) => {
                          if (response.payload) navigate('/');
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

          {forgotPasswordStep === 1 && (
            <Formik
              initialValues={{ email: '' }}
              validationSchema={Yup.object({
                email: Yup.string().email('Invalid email').required('Email is required'),
              })}
              onSubmit={(values) => {
                // Logic to handle form submission
                dispatch(forgotPassword(values.email)).then((response) => {
                  if (response.payload) handleSendOTP();
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
      </div>
    </div>
  );
};

export default Login;
