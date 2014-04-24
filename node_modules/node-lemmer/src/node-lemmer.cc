#include <v8.h>
#include <node.h>
#include <vector>
#include <algorithm>

#include <turglem/lemmatizer.hpp>
#include <turglem/english/charset_adapters.hpp>
#include <turglem/russian/charset_adapters.hpp>

using namespace node;
using namespace v8;
using namespace std;

class Lemmer : public ObjectWrap, public tl::lemmatizer {
public:
	static void Initialize(Handle<Object> target) {
        HandleScope scope;
        Local<FunctionTemplate> t = FunctionTemplate::New(New);
        t->InstanceTemplate()->SetInternalFieldCount(1);

        NODE_SET_PROTOTYPE_METHOD(t, "lemmatizeEng", Lemmatize<english_utf8_adapter>);
        NODE_SET_PROTOTYPE_METHOD(t, "lemmatizeRus", Lemmatize<russian_utf8_adapter>);

        target->Set(String::NewSymbol("Lemmer"), t->GetFunction());
    }

protected:
    struct Form {
        string text;
        u_int8_t partOfSpeech;

        bool operator<(const Form& other) const {
            return partOfSpeech == other.partOfSpeech ? text < other.text : partOfSpeech < other.partOfSpeech;
        }

        bool operator==(const Form& other) const {
            return partOfSpeech == other.partOfSpeech && text == other.text;
        }
    };

protected:
    static Handle<Value> New(const Arguments& args) {
        HandleScope scope;

         if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString())
            return ThrowException(Exception::TypeError(String::New("Wrong args")));

        string dict = ToStdString(args[0]);
        string paradigms = ToStdString(args[1]);
        string predict;
        if (args.Length() == 3 && args[2]->IsString())
            predict = ToStdString(args[2]);

        Lemmer* lemmer = new Lemmer(dict, paradigms, predict);
        lemmer->Wrap(args.This());
        return args.This();
    }

    Lemmer(const string& dict, const string& paradigms, const string& predict)
        : ObjectWrap()
    {
        load_lemmatizer(dict.c_str(), paradigms.c_str(), !predict.empty() ? predict.c_str() : NULL);
    }

    virtual ~Lemmer() throw() {}

    template<typename adapter>
    static Handle<Value> Lemmatize(const Arguments& args) {
        Lemmer* lemmer = ObjectWrap::Unwrap<Lemmer>(args.This());
        HandleScope scope;

        if (args.Length() != 1 || !args[0]->IsString())
            return ThrowException(Exception::TypeError(String::New("Wrong args")));

        string word = ToStdString(args[0]);
        if (word.empty())
            return ThrowException(Exception::TypeError(String::New("Passed word is empty")));
       

        vector<Form> mainforms = lemmer->Lemmatize<adapter>(word);

        Local<Array> res = Array::New(mainforms.size());
        for (size_t i = 0; i < mainforms.size(); ++i) {
            Local<Object> form = Object::New();
            form->Set(NODE_PSYMBOL("text"), String::New(mainforms[i].text.c_str()));
            form->Set(NODE_PSYMBOL("partOfSpeech"), Integer::New(mainforms[i].partOfSpeech));
            res->Set(Integer::New(i), form);
        }

        return scope.Close(res);
    }

    template<typename adapter>
    vector<Form> Lemmatize(const string& word) {
        tl::lem_result lr;
        size_t count = lemmatize<adapter>(word.c_str(), lr);

        vector<Form> result;
        for (size_t i = 0; i < count; i++) {
            Form form;
            form.partOfSpeech = get_part_of_speech(lr, i, get_src_form(lr, i));
            form.text = get_text<adapter>(lr, i, 0);
            result.push_back(form);
        }

        sort(result.begin(), result.end());
        result.erase(unique(result.begin(), result.end()), result.end());

        return result;
    }

private:
    static string ToStdString(const Local<Value>& v) {
        String::Utf8Value temp(v->ToString());
        return string(*temp);
    }

};

extern "C" {
	static void init(Handle<Object> target) {
		Lemmer::Initialize(target);
	}

	NODE_MODULE(node_lemmer, init)
}
