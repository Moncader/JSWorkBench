/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


#ifndef _API_H

#define _API_H 1

#include <string>
#include <v8.h>

using namespace std;
using namespace v8;

Persistent<Context> sCreateContext();

Handle<Value> sPrint(const Arguments &pArgs);

Handle<Value> sInput(const Arguments &pArgs);

Handle<Value> sRead(const Arguments &pArgs);

Handle<Value> sWrite(const Arguments &pArgs);

Handle<Value> sFork(const Arguments &pArgs);

Handle<Value> sSleep(const Arguments &pArgs);

Handle<Value> sSystem(const Arguments &pArgs);

Handle<Value> sChdir(const Arguments &pArgs);

Handle<Value> sGetcwd(const Arguments &pArgs);

Handle<Value> sEvalFileInSandbox(const Arguments &pArgs);

Handle<Value> sEvalInSandbox(const Arguments &pArgs);

Handle<Value> sEvalFile(const Arguments &pArgs);

Handle<Value> sStat(const Arguments &pArgs);

Handle<Value> sSetenv(const Arguments &pArgs);

Handle<Value> sGetenv(const Arguments &pArgs);

Handle<Value> sUnsetenv(const Arguments &pArgs);

Handle<Value> sRealpath(const Arguments &pArgs);

Handle<Value> sReadAsset(const Arguments &pArgs);

Handle<Value> sDLOpen(const Arguments &pArgs);

Handle<Value> sDLSym(const Arguments &pArgs);

Handle<Value> sDLClose(const Arguments &pArgs);

Handle<Value> sDLError(const Arguments &pArgs);


Handle<Value> sReadFile(const char *pName);

Handle<Value> sWriteFile(const char *pName, const char *pContent, int pLength);

void sReportException(TryCatch *pHandler);

inline const char* sToCString(const String::Utf8Value &pValue) {
  return *pValue ? *pValue : "<string conversion failed>";
}

#endif
