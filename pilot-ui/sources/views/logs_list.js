import {JetView} from "webix-jet";

import LogsCollection from './../models/LogsCollection';
import Message from "../plugins/Message";

let top_controls_id = null;


export default class LogsListView extends JetView {
    config(){
        return view_config;
    }

    init(view, url){

        top_controls_id = webix.$$('top_view_controls').addView(top_controls);

        this.table_logs = this.$$('table:logs');
        this.logs_upload_btn = webix.$$('logs_top:btn:add');
        this.logs_uploader_list = this.ui(log_uploader_list);
        this.logs_uploader_api = this.ui(log_uploader);

        // Синхронизация с коллекцией
        this.table_logs.sync(LogsCollection);

    }

    ready(view, url){

        const _this = this;

        //
        // Установить заголовок приложения
        this.app.getService('topTitle').update('Flight Logs');

        this.logs_uploader_api.attachEvent('onBeforeFileAdd', item => {
            let type = item.type.toLowerCase();
            if ( type !== 'bin' ){
                Message.error("Only BIN files can be uploaded");
                return false;
            }
        });

        this.logs_uploader_api.attachEvent('onAfterFileAdd', item => {
            this.logs_uploader_list.show();
        });

        this.logs_uploader_api.attachEvent('onFileUpload', item => {
            console.log('Uploaded', item);
        });

        this.logs_uploader_api.attachEvent('onFileUploadError', err => {
            console.log('Upload error', err);
        });

        this.logs_uploader_api.attachEvent('onUploadComplete', () => {
            Message.info('Files uploaded');
            this.logs_uploader_list.hide();
            this.logs_uploader_api.files.data.clearAll();
            //console.log(this.logs_uploader_api.files.data.clearAll());
        });


        //
        // Кнопка Загрузить лог
        this.logs_upload_btn.attachEvent('onItemClick', () => {
            // Загрузить файлы на сервер

            Message.info('Upload files');

            // TODO загрузить лог
            this.logs_uploader_api.fileDialog();

        });

        //
        // Клик по строке в таблице открывает лог
        this.table_logs.attachEvent('onItemClick', (id, e, node) => {

            // TODO открыть вид с логом
            Message.info('Open log view');

            this.show('log_view?id=' + id.toString());

        });

        LogsCollection.List();

        //console.log(this.app.getService('io'));

        //
        // Отслеживание изменений в БД
        this.app.getService('io').on('logs_look', function(changes){
            if( !changes.hasOwnProperty('e') || !changes.hasOwnProperty('data') ) return;

            if( 'new' === changes.e ){
                LogsCollection.add(changes.data);
            }
            else if( 'del' === changes.e ){
                LogsCollection.remove(changes.data.id);
            }
            else if( 'upd' === changes.e ){
                let id = changes.data.id;
                delete changes.data.id;
                LogsCollection.updateItem(id, changes.data);
            }

        });

    }

    destroy(){
        if( webix.$$('top_view_controls') && top_controls_id ){
            webix.$$('top_view_controls').removeView(top_controls_id);
        }
    }

}


//
// Кнопки для верхней панели приложения
const top_controls = {
    cols: [
        // Кнопка Добавить нового дрона
        {
            view: 'button'
            ,type: 'iconButton'
            ,id: 'logs_top:btn:add'
            ,label: 'Upload log'
            ,icon: 'mdi mdi-plus'
            ,css: 'button_primary'
            ,autowidth: true
        }
        ,{}
    ]
};

//
// Загрузчик файлов
const log_uploader = {
    view: "uploader",
    id: "logs:uploadAPI",
    apiOnly: true,
    autosend: true,
    link: 'logs_uploader_list',
    upload: "/api/log_upload"
};

//
// Окошко со списком загружаемых файлов
const log_uploader_list = {
    view: 'window'
    ,id: 'logs_view_popup_upload'
    ,headHeight: 0
    ,head: false
    ,borderless: true
    ,position: 'center'
    ,body: {
        padding: 20
        ,width: 500
        ,rows: [
            {
                view: 'scrollview'
                ,scroll: 'y'
                ,body: {
                    rows: [
                        {
                            view: 'list'
                            ,id: 'logs_uploader_list'
                            ,type: 'uploader'
                            ,autoheight: true
                            ,maxHeight: 350
                            ,borderless: true
                        }
                    ]
                }
            }
        ]
    }
};


//
// Основная таблица со списком
const view_config = {
    type: 'clean'
    ,rows: [

        // Таблица
        {
            view:"datatable"
            ,localId: 'table:logs'
            ,select: true
            ,columns:[
                { id: "date",	header: "Date", width: 150},
                { id: "name",	header: "Name", fillspace: 1},
                { id: "location",	header: "Location", fillspace: 1},
                { id: "ft",	    header: "Flight Time" , width: 200},
                { id: "status",	    header: "Status" , width: 100}
            ]

        }
    ]

};


