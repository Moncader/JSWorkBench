/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


#include <iostream>
#include <map>
#include <string>
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <time.h>
#include <limits.h>
#include <dlfcn.h>

#include <v8.h>
#include "api.h"

using namespace std;
using namespace v8;


Handle<Context> sCreateContext(Isolate *pIsolate) {
  Handle<ObjectTemplate> tGlobal = ObjectTemplate::New(pIsolate);

  tGlobal->Set(String::NewFromUtf8(pIsolate, "print"), FunctionTemplate::New(pIsolate, sPrint));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "input"), FunctionTemplate::New(pIsolate, sInput));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "read"), FunctionTemplate::New(pIsolate, sRead));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "write"), FunctionTemplate::New(pIsolate, sWrite));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "fork"), FunctionTemplate::New(pIsolate, sFork));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "sleep"), FunctionTemplate::New(pIsolate, sSleep));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "system"), FunctionTemplate::New(pIsolate, sSystem));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "chdir"), FunctionTemplate::New(pIsolate, sChdir));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "getcwd"), FunctionTemplate::New(pIsolate, sGetcwd));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "evalFileInSandbox"), FunctionTemplate::New(pIsolate, sEvalFileInSandbox));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "evalInSandbox"), FunctionTemplate::New(pIsolate, sEvalInSandbox));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "evalFile"), FunctionTemplate::New(pIsolate, sEvalFile));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "stat"), FunctionTemplate::New(pIsolate, sStat));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "setenv"), FunctionTemplate::New(pIsolate, sSetenv));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "getenv"), FunctionTemplate::New(pIsolate, sGetenv));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "unsetenv"), FunctionTemplate::New(pIsolate, sUnsetenv));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "realpath"), FunctionTemplate::New(pIsolate, sRealpath));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "readAsset"), FunctionTemplate::New(pIsolate, sReadAsset));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "dlopen"), FunctionTemplate::New(pIsolate, sDLOpen));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "dlsym"), FunctionTemplate::New(pIsolate, sDLSym));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "dlclose"), FunctionTemplate::New(pIsolate, sDLClose));

  tGlobal->Set(String::NewFromUtf8(pIsolate, "dlerror"), FunctionTemplate::New(pIsolate, sDLError));

  return Context::New(pIsolate, NULL, tGlobal);
}

class LibraryHandle {
  public:
    LibraryHandle(void *pHandle) : handle(pHandle) {}
    void *handle;
};

class SymbolHandle {
  public:
    SymbolHandle(void *pHandle) : handle(pHandle) {}
    void *handle;
};

static void sDLOpen(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();

  if (pArgs.Length() != 2) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments.")));

    return;
  }

  String::Utf8Value tLibraryName(pArgs[0]);
  int tFlags = Local<Integer>::Cast(pArgs[1])->Int32Value();

  void *tHandle = dlopen(*tLibraryName, tFlags);

  if (tHandle == NULL) {
    pArgs.GetReturnValue().Set(Null(tIsolate));
  }

  Handle<ObjectTemplate> tTemplate = ObjectTemplate::New(tIsolate);
  tTemplate->SetInternalFieldCount(1);

  Local<Object> tObject = tTemplate->NewInstance();
  tObject->SetInternalField(0, External::New(tIsolate, new LibraryHandle(tHandle)));

  pArgs.GetReturnValue().Set(tObject);
}

static void sDLSym(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();

  if (pArgs.Length() != 2) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments.")));

    return;
  }

  Local<Object> tLibraryHandleObject = pArgs[0]->ToObject();
  LibraryHandle *tLibraryHandle = static_cast<LibraryHandle *>(Local<External>::Cast(tLibraryHandleObject->GetInternalField(0))->Value());
  void *tHandle = tLibraryHandle->handle;

  String::Utf8Value tSymbolName(pArgs[1]);

  void *tSymbolHandle = dlsym(tHandle, *tSymbolName);

  if (tSymbolHandle == NULL) {
    pArgs.GetReturnValue().Set(Null(tIsolate));

    return;
  }

  Handle<ObjectTemplate> tTemplate = ObjectTemplate::New(tIsolate);
  tTemplate->SetInternalFieldCount(1);

  Local<Object> tObject = tTemplate->NewInstance();
  tObject->SetInternalField(0, External::New(tIsolate, new SymbolHandle(tSymbolHandle)));

  pArgs.GetReturnValue().Set(tObject);
}

static void sDLClose(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments.")));

    return;
  }

  String::Utf8Value tStr(pArgs[0]);

  pArgs.GetReturnValue().Set(Undefined(tIsolate));
}

static void sDLError(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  char *tError = dlerror();

  if (tError == NULL) {
    pArgs.GetReturnValue().Set(Null(tIsolate));

    return;
  }

  pArgs.GetReturnValue().Set(String::NewFromUtf8(tIsolate, tError));
}

static void sPrint(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  bool tFirst = true;
  for (int i = 0, il = pArgs.Length(); i < il; i++) {
    if (tFirst == true) {
      tFirst = false;
    } else {
      printf(" ");
    }

    String::Utf8Value tStr(pArgs[i]);
    const char* tCStr = sToCString(tStr);

    printf("%s", tCStr);
  }

  printf("\n");
  fflush(stdout);
  pArgs.GetReturnValue().Set(Undefined(tIsolate));
}

static void sInput(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  string tIn;
  string tFinal = "";
  while (cin) {
    getline(cin, tIn);
    tFinal += tIn;
  }

  Handle<String> tResult = String::NewFromUtf8(tIsolate, tFinal.c_str());
  pArgs.GetReturnValue().Set(tResult);
}

extern char sAssetFiles[];
extern char *sAssetFileNames[];
extern const int sAssetFileLengths[];
extern const int sAssetFilesCount;

static void sReadAsset(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  int tIndex = -1;
  int tByteIndex = 0;
  int i;

  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments.")));

    return;
  }

  String::Utf8Value tAssetName(pArgs[0]);

  for (i = 0; i < sAssetFilesCount; i++) {
    if (strcmp(*tAssetName, sAssetFileNames[i]) == 0) {
      tIndex = i;
      break;
    }

    tByteIndex += sAssetFileLengths[i];
  }

  if (tIndex == -1) {
    pArgs.GetReturnValue().Set(Null(tIsolate));

    return;
  }

  Handle<String> tContents = String::NewFromUtf8(tIsolate, sAssetFiles + tByteIndex, String::kNormalString, sAssetFileLengths[tIndex]);

  pArgs.GetReturnValue().Set(tContents);
}

static void sRead(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments.")));

    return;
  }

  String::Utf8Value tStr(pArgs[0]);
  pArgs.GetReturnValue().Set(sReadFile(tIsolate, sToCString(tStr)));
}

static void sWrite(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 2) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments.")));

    return;
  }

  String::Utf8Value tFileName(pArgs[0]);
  String::Utf8Value tContent(pArgs[1]);

  sWriteFile(tIsolate, sToCString(tFileName), sToCString(tContent), tContent.length());

  pArgs.GetReturnValue().Set(Undefined(tIsolate));
}

static void sFork(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 0) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments.")));

    return;
  }

  pid_t tPid = fork();
  pArgs.GetReturnValue().Set(Integer::NewFromUnsigned(tIsolate, tPid));
}

static void sSleep(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments")));

    return;    
  }

  Local<Integer> tTime = Local<Integer>::Cast(pArgs[0]);
  sleep(tTime->Int32Value());
  pArgs.GetReturnValue().Set(Undefined(tIsolate));
}

static void sSystem(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments")));
  }

  String::Utf8Value tCommand(pArgs[0]);
  FILE *tFp = popen(*tCommand, "r");

  if (tFp == NULL) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Failed to execute command.")));

    return;
  }

  char tBuffer[256];
  string tResult = "";

  while (fgets(tBuffer, 256, tFp) != NULL) {
    tResult += tBuffer;
  }

  pclose(tFp);

  Handle<String> tValue = String::NewFromUtf8(tIsolate, tResult.c_str(), String::kNormalString, tResult.length());

  pArgs.GetReturnValue().Set(tValue);
}

static void sChdir(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments")));

    return;
  }

  String::Utf8Value tDirectory(pArgs[0]);
  if (chdir(*tDirectory) != 0) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Failed to change to given directory.")));

    return;
  }

  pArgs.GetReturnValue().Set(Undefined(tIsolate));
}

static void sGetcwd(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  // TODO: Support any size of directory name...
  char *dir = (char *)malloc(sizeof(char) * 1024);
  if (dir == NULL) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Out of memory")));

    return;
  }

  if (getcwd(dir, sizeof(char) * 1024) == NULL) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Could not get current working directory")));

    return;
  }

  Handle<String> tReturn = String::NewFromUtf8(tIsolate, dir);

  free(dir);

  pArgs.GetReturnValue().Set(tReturn);
}

inline void cleanContextIfSandboxed(Handle<Context> pContext, bool pIsSandboxed) {
  if (pIsSandboxed) {
    pContext->Exit();
  }
}

static void sEvalScript(const v8::FunctionCallbackInfo<Value> &pArgs, bool pIsSandboxed, bool pIsString) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (!pArgs[0]->IsString()) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "First argument must be a string")));
  }

  if (pIsSandboxed && !pArgs[1]->IsObject()) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Second argument must be an object or null")));
  }

  Handle<Value> tContentsAsValue;

  if (!pIsString) {
    String::Utf8Value tFileName(pArgs[0]);
    tContentsAsValue = sReadFile(tIsolate, *tFileName);
  } else {
    tContentsAsValue = pArgs[0];
  }

  if (tContentsAsValue.IsEmpty()) {
    pArgs.GetReturnValue().Set(tContentsAsValue);

    return;
  }

  HandleScope tScope(tIsolate);
  Handle<Context> tContext = tIsolate->GetCurrentContext();

  if (pIsSandboxed) {
    Handle<Object> tGlobalObject = Handle<Object>::Cast(pArgs[1]);

    Handle<Array> tProperties = tGlobalObject->GetPropertyNames();
    Handle<ObjectTemplate> tGlobal = ObjectTemplate::New(tIsolate);

    for (int i = 0, il = tProperties->Length(); i < il; i++) {
      Handle<String> tKey = Handle<String>::Cast(tProperties->Get(i));
      Handle<Value> tValue = tGlobalObject->Get(tKey);
      tGlobal->Set(tKey, tValue);
    }

    tContext = Context::New(tIsolate, NULL, tGlobal);
    tContext->Enter();
  }

  TryCatch tTryCatch;

  String::Utf8Value tScriptToEval(tContentsAsValue);
  Handle<String> tScriptHandle = String::NewFromUtf8(tIsolate, *tScriptToEval);

  Handle<Script> tScript = Script::Compile(tScriptHandle);

  if (tScript.IsEmpty()) {
    cleanContextIfSandboxed(tContext, pIsSandboxed);
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(tTryCatch.Exception()));

    return;
  }

  Handle<Value> tResult = tScript->Run();

  if (tResult.IsEmpty()) {
    cleanContextIfSandboxed(tContext, pIsSandboxed);
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(tTryCatch.Exception()));

    return;
  }

  cleanContextIfSandboxed(tContext, pIsSandboxed);

  pArgs.GetReturnValue().Set(Undefined(tIsolate));
}

static void sEvalFileInSandbox(const v8::FunctionCallbackInfo<Value> &pArgs) {
  sEvalScript(pArgs, true, false);
}

static void sEvalInSandbox(const v8::FunctionCallbackInfo<Value> &pArgs) {
  sEvalScript(pArgs, true, true);
}

static void sEvalFile(const v8::FunctionCallbackInfo<Value> &pArgs) {
  sEvalScript(pArgs, false, false);
}

static void sStat(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Too many arguments")));

    return;
  }

  String::Utf8Value tFileName(pArgs[0]);

  struct stat tStat;

  if (stat(*tFileName, &tStat) == -1) {
    pArgs.GetReturnValue().Set(Null(tIsolate));

    return;
  }

  Handle<Object> tStatObj = Object::New(tIsolate);
  tStatObj->Set(String::NewFromUtf8(tIsolate, "deviceId"), Integer::New(tIsolate, tStat.st_dev));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "inodeNumber"), Integer::New(tIsolate, tStat.st_ino));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "mode"), Integer::New(tIsolate, tStat.st_mode));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "hardLinksCount"), Integer::New(tIsolate, tStat.st_nlink));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "uid"), Integer::New(tIsolate, tStat.st_uid));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "gid"), Integer::New(tIsolate, tStat.st_gid));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "specialDeviceId"), Integer::New(tIsolate, tStat.st_rdev));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "size"), Integer::New(tIsolate, tStat.st_size));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "blockSize"), Integer::New(tIsolate, tStat.st_blksize));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "blocksCount"), Integer::New(tIsolate, tStat.st_blocks));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "atime"), Integer::New(tIsolate, tStat.st_atime));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "mtime"), Integer::New(tIsolate, tStat.st_mtime));
  tStatObj->Set(String::NewFromUtf8(tIsolate, "ctime"), Integer::New(tIsolate, tStat.st_ctime));

  pArgs.GetReturnValue().Set(tStatObj);
}

static void sSetenv(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 2) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Need 2 arguments")));

    return;
  }

  String::Utf8Value tName(pArgs[0]);
  String::Utf8Value tValue(pArgs[1]);

  if (setenv(*tName, *tValue, 1) != 0) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Failed to set environment variable")));

    return;
  }

  pArgs.GetReturnValue().Set(Undefined(tIsolate));
}

static void sGetenv(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Need 1 argument")));

    return;
  }

  String::Utf8Value tName(pArgs[0]);

  char *tValue;

  if ((tValue = getenv(*tName)) == NULL) {
    pArgs.GetReturnValue().Set(Null(tIsolate));

    return;
  }

  Handle<String> tResult = String::NewFromUtf8(tIsolate, tValue);

  pArgs.GetReturnValue().Set(tResult);
}

static void sUnsetenv(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Need 1 argument")));

    return;
  }

  String::Utf8Value tName(pArgs[0]);

  if (unsetenv(*tName) != 0) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Failed to unset environment variable")));

    return;
  }

  pArgs.GetReturnValue().Set(Undefined(tIsolate));
}

static void sRealpath(const v8::FunctionCallbackInfo<Value> &pArgs) {
  Isolate *tIsolate = pArgs.GetIsolate();
  
  if (pArgs.Length() != 1) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Need 1 argument")));

    return;
  }

  String::Utf8Value tName(pArgs[0]);

  char tResolvedName[PATH_MAX + 1];
  if (realpath(*tName, tResolvedName) == NULL) {
    pArgs.GetReturnValue().Set(tIsolate->ThrowException(String::NewFromUtf8(tIsolate, "Invalid path to realpath")));

    return;
  }

  Handle<String> tResult = String::NewFromUtf8(tIsolate, tResolvedName);

  pArgs.GetReturnValue().Set(tResult);
}


static Handle<Value> sReadFile(Isolate *pIsolate, const char *pName) {
  FILE *tFile = fopen(pName, "rb");
  if (tFile == NULL) {
    return pIsolate->ThrowException(String::NewFromUtf8(pIsolate, "File doesn't exist."));
  }

  fseek(tFile, 0, SEEK_END);
  int tSize = ftell(tFile);
  rewind(tFile);

  char *tChars = new char[tSize + 1];
  tChars[tSize] = '\n';

  for (int i = 0; i < tSize;) {
    int tRead = fread(&tChars[i], 1, tSize - i, tFile);
    i += tRead;
  }

  fclose(tFile);

  Handle<String> tResult = String::NewFromUtf8(pIsolate, tChars, String::kNormalString, tSize);
  delete[] tChars;

  return tResult;
}

static Handle<Value> sWriteFile(Isolate *pIsolate, const char *pName, const char *pContent, int pLength) {
  FILE *tFile = fopen(pName, "wb");
  if (tFile == NULL) {
    return pIsolate->ThrowException(String::NewFromUtf8(pIsolate, "Could not open file for writing."));
  }

  if (fwrite(pContent, 1, pLength, tFile) != pLength) {
    fclose(tFile);

    return pIsolate->ThrowException(String::NewFromUtf8(pIsolate, "Failed writing all the data to file."));
  }

  fclose(tFile);

  return Undefined(pIsolate);
}

static void sReportException(TryCatch *pHandler) {
  printf("Exception occurred\n");
}
