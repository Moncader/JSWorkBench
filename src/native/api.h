/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


#ifndef _API_H

#define _API_H 1

#include <string.h>
#include <v8.h>

using namespace std;
using namespace v8;

Handle<Context> sCreateContext(Isolate *pIsolate);

static void sPrint(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sInput(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sRead(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sWrite(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sFork(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sSleep(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sSystem(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sChdir(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sGetcwd(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sEvalFileInSandbox(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sEvalInSandbox(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sEvalFile(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sStat(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sSetenv(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sGetenv(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sUnsetenv(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sRealpath(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sReadAsset(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sDLOpen(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sDLSym(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sDLClose(const v8::FunctionCallbackInfo<Value> &pArgs);
static void sDLError(const v8::FunctionCallbackInfo<Value> &pArgs);
static Handle<Value> sReadFile(Isolate *pIsolate, const char *pName);
static Handle<Value> sWriteFile(Isolate *pIsolate, const char *pName, const char *pContent, int pLength);
static void sReportException(TryCatch *pHandler);

inline const char* sToCString(const String::Utf8Value &pValue) {
  return *pValue ? *pValue : "<string conversion failed>";
}

#endif
