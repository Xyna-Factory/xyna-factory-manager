/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector } from '@angular/core';

import { XoFactoryNode, XoFactoryNodeArray } from '@fman/runtime-contexts/xo/xo-factory-node.model';
import { XoImportRTARequest } from '@fman/runtime-contexts/xo/xo-import-rta-request.model';
import { XoManagedFileId } from '@fman/runtime-contexts/xo/xo-managed-file-id.model';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcDialogService } from '@zeta/xc';

import { throwError } from 'rxjs';
import { catchError, filter, finalize, tap } from 'rxjs/operators';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { importRuntimeApplication_translations_de_DE } from './locale/import-runtime-application-translations.de-DE';
import { importRuntimeApplication_translations_en_US } from './locale/import-runtime-application-translations.en-US';


class NodeWrapper {
    constructor(public node: XoFactoryNode, public used: boolean) {}
}


@Component({
    templateUrl: './import-runtime-application-dialog.component.html',
    styleUrls: ['./import-runtime-application-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ImportRuntimeApplicationDialogComponent extends XcDialogComponent<boolean, void> {

    nodes: NodeWrapper[] = [];

    importRequest = new XoImportRTARequest();
    filename = '';
    erroneousFilename = false;
    useApplication = true;
    loadingFile = false;
    importing = false;


    constructor(injector: Injector, private readonly apiService: ApiService, private readonly dialogService: XcDialogService, private readonly i18n: I18nService, private readonly cdr: ChangeDetectorRef) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, importRuntimeApplication_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, importRuntimeApplication_translations_en_US);

        this.apiService.startOrderAssert<XoFactoryNodeArray>(FM_RTC, ORDER_TYPES.GET_FACTORY_NODES, [], XoFactoryNodeArray).subscribe(
            nodes => {
                this.nodes = nodes.data.map(node => new NodeWrapper(node, true));
                cdr.markForCheck();
            }
        );
    }


    chooseFile() {
        this.loadingFile = true;
        this.apiService.browse(3 * 60 * 1000).subscribe(
            file => {
                this.filename = file.name;
                this.cdr.markForCheck();
                this.apiService.upload(file)
                    .pipe(catchError(error => {
                        this.erroneousFilename = true;
                        this.loadingFile = false;
                        this.cdr.markForCheck();
                        return throwError(error);
                    }))
                    .subscribe(managedFileId => {
                        this.importRequest.managedFileId = new XoManagedFileId();
                        this.importRequest.managedFileId.id = managedFileId.iD;
                        this.erroneousFilename = false;
                        this.loadingFile = false;
                        this.cdr.markForCheck();
                    });
            }
        );
    }


    import() {
        if (!this.importRequest.managedFileId) {
            console.warn('There is no Application to import');
            return;
        }

        this.importing = true;

        // populate request
        this.importRequest.globalSettingsOnly = !this.useApplication;
        this.importRequest.targetNodes = new XoFactoryNodeArray();
        this.importRequest.targetNodes.data.push(...this.nodes.filter(node => node.used).map(node => node.node));

        this.apiService.startOrder(FM_RTC, ORDER_TYPES.IMPORT_RTA, this.importRequest, undefined, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage).pipe(
            catchError((error: any) => {
                this.dismiss(false);
                return throwError(error);
            }),
            tap(result => this.dismiss(!result.errorMessage)),
            filter(result => !!result.errorMessage),
            tap(result => this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'))),
            finalize(() => {
                this.importing = false;
                this.cdr.markForCheck();
            })
        ).subscribe(result => {
            if (!result.errorMessage) {
                this.dismiss();
            }
        });
    }
}
