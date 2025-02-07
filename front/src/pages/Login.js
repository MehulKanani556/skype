import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin, login, register } from "../redux/slice/auth.slice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const togglePanel = () => {
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
      ${
        isMobile
          ? `w-full ${
              isRightPanelActive
                ? isSignUp
                  ? "translate-x-0"
                  : "translate-x-full"
                : isSignUp
                ? "translate-x-full"
                : "translate-x-0"
            }`
          : `w-1/2 ${
              isRightPanelActive
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

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-xl shadow-2xl relative overflow-hidden w-full max-w-4xl min-h-[620px] md:min-h-[480px]
        ${isRightPanelActive ? "right-panel-active" : ""}`}
      >
        {/* Sign Up Form */}
        <FormContainer isSignUp={true}>
          <Formik
            initialValues={{ userName: "", email: "", password: "" }}
            validationSchema={signUpSchema}
            onSubmit={(values) => {
              dispatch(register(values)).then((response) => {
                if (response.payload) navigate("/");
              });
            }}
          >
            <Form className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-8">
              <h1 className="text-2xl font-bold mb-6">Create Account</h1>

              <div className="w-full space-y-4">
                <div>
                  <Field
                    type="text"
                    name="userName"
                    placeholder="User Name"
                    className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="userName"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div>
                  <Field
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
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
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <GoogleLogin
                  onSuccess={(response) => {
                    const {
                      name,
                      email,
                      sub: uid,
                    } = jwtDecode(response.credential);
                    dispatch(googleLogin({ uid, name, email })).then(
                      (response) => {
                        if (response.payload) navigate("/");
                      }
                    );
                  }}
                  onFailure={console.error}
                  render={(renderProps) => (
                    <button
                      onClick={renderProps.onClick}
                      disabled={renderProps.disabled}
                      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={require("../assets/google-logo.png")}
                        alt="Google"
                        className="w-5 h-5"
                      />
                      <span>Continue with Google</span>
                    </button>
                  )}
                />
              </div>
            </Form>
          </Formik>
        </FormContainer>

        {/* Sign In Form */}
        <FormContainer isSignUp={false}>
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={signInSchema}
            onSubmit={(values) => {
              dispatch(login(values)).then((response) => {
                if (response.payload) navigate("/");
              });
            }}
          >
            <Form className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-6">
              <h1 className="text-2xl font-bold mb-6">Sign In</h1>

              <div className="w-full space-y-4">
                <div>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div>
                  <Field
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="bg-gray-100 border-none px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div className="flex justify-end">
                  <a
                    href="#"
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Forgot password?
                  </a>
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
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <GoogleLogin
                  onSuccess={(response) => {
                    const {
                      name,
                      email,
                      sub: uid,
                    } = jwtDecode(response.credential);
                    dispatch(googleLogin({ uid, name, email })).then(
                      (response) => {
                        if (response.payload) navigate("/");
                      }
                    );
                  }}
                  onFailure={console.error}
                  render={(renderProps) => (
                    <button
                      onClick={renderProps.onClick}
                      disabled={renderProps.disabled}
                      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={require("../assets/google-logo.png")}
                        alt="Google"
                        className="w-5 h-5"
                      />
                      <span>Continue with Google</span>
                    </button>
                  )}
                />
              </div>
            </Form>
          </Formik>
        </FormContainer>

        {/* Overlay Container */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-500 ease-in-out z-50
          ${
            isMobile
              ? "hidden"
              : `${isRightPanelActive ? "-translate-x-full" : ""}`
          }`}
        >
          <div
            className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white relative -left-full h-full w-[200%] transform 
            ${
              isRightPanelActive ? "translate-x-1/2" : "translate-x-0"
            } transition-transform duration-500 ease-in-out`}
          >
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
