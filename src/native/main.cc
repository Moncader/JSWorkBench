/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


#include <stdio.h>
#include <string>

#include <v8.h>
#include "api.h"

using namespace std;
using namespace v8;

extern char sJavaScriptFiles[];
extern const int sJavaScriptFileLengths[];
extern const int sJavaScriptFilesCount;

extern char sAssetFiles[];
extern const int sAssetFileLengths[];
extern const int sAssetFilesCount;

int main(int argc, char *argv[]) {
  V8::InitializeICU();
  V8::SetFlagsFromCommandLine(&argc, argv, true);

  Isolate *tIsolate = Isolate::GetCurrent();

  HandleScope tScope(tIsolate);

  Handle<Context> tContext = sCreateContext(tIsolate);

  if (tContext.IsEmpty()) {
    printf("Error creating context\n");

    return 1;
  }

  tContext->Enter();

  Handle<Array> tArguments = Array::New(tIsolate, argc);

  for (int i = 0; i < argc; i++) {
    tArguments->Set(i, String::NewFromUtf8(tIsolate, argv[i]));
  }

  tContext->Global()->Set(String::NewFromUtf8(tIsolate, "args"), tArguments);

  char *tPointer = sJavaScriptFiles;
  for (int i = 0; i < sJavaScriptFilesCount; i++) {
    Handle<String> tStr = String::NewFromUtf8(tIsolate, tPointer, String::kNormalString, sJavaScriptFileLengths[i]);
    TryCatch tTryCatch;

    Handle<Script> tScript = Script::Compile(tStr);

    if (tScript.IsEmpty()) {
      Handle<Value> tStackTrace = tTryCatch.StackTrace();

      String::Utf8Value tCompileString(tStackTrace);
      printf("Parsing error in JavaScript file index %d.\n%s\n", i, *tCompileString);
      return 1;
    }

    Handle<Value> tResult = tScript->Run();

    if (tResult.IsEmpty()) {
      Handle<Value> tException = tTryCatch.StackTrace();
      String::Utf8Value tErrString(tException);
      printf("Uncaught Exception from index %d:\n    %s\n", i, *tErrString);
    }
    tPointer += sJavaScriptFileLengths[i];
  }

  if (tContext->Global()->Has(String::NewFromUtf8(tIsolate, "main"))) {
    TryCatch tTryCatch;
    Function *tFunction = Function::Cast(*tContext->Global()->Get(String::NewFromUtf8(tIsolate, "main")));
    Handle<Value> tResult = tFunction->Call(tContext->Global(), 0, NULL);
    if (tResult.IsEmpty()) {
      Handle<Value> tException = tTryCatch.StackTrace();
      String::Utf8Value tErrString(tException);
      printf("Uncaught Exception from main():\n    %s\n", *tErrString);
    }
  }

  tContext->Exit();
  tIsolate->Exit();
  tIsolate->Dispose();

  return 0;
}


