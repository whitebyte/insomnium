import React, { FC, useEffect, useRef } from 'react';
import { OverlayContainer } from 'react-aria';
import { useFetcher, useParams } from 'react-router-dom';
import { strings } from '../../../common/strings';
import { Project } from '../../../models/project';
import { Modal, type ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';
import { PromptButton } from '../base/prompt-button';

export interface ProjectSettingsModalProps extends ModalProps {
    project: Project;
}

export const ProjectSettingsModal: FC<ProjectSettingsModalProps> = ({ project, onHide }) => {
    const modalRef = useRef<ModalHandle>(null);
    const { submit } = useFetcher();

    useEffect(() => {
        modalRef.current?.show();
    }, []);

    return (
        <OverlayContainer>
            <Modal onHide={onHide} ref={modalRef}>
                <ModalHeader key={`header::${project._id}`}>
                    {strings.project.singular} Settings{' '}
                    <div className="txt-sm selectable faint monospace">{project._id}</div>
                </ModalHeader>
                <ModalBody key={`body::${project._id}`} className="pad">
                    <div className="form-control form-control--outlined">
                        <label>
                            Name
                            {(
                                <input
                                    type="text"
                                    placeholder={`My ${strings.project.singular}`}
                                    defaultValue={project.name}
                                    onChange={e => {
                                        submit(
                                            {
                                                name: e.currentTarget.value
                                            },
                                            {
                                                action: `/project/${project._id}/rename`,
                                                method: 'post'
                                            }
                                        );
                                    }}
                                />
                            )}
                        </label>
                    </div>
                    <h2>Actions</h2>
                    <div className="form-control form-control--padded">
                        <PromptButton
                            onClick={() =>
                                submit(
                                    {},
                                    { method: 'post', action: `/project/${project._id}/delete` }
                                )
                            }
                            className="width-auto btn btn--clicky inline-block"
                        >
                            <i className="fa fa-trash-o" /> Delete
                        </PromptButton>
                    </div>
                </ModalBody>
            </Modal>
        </OverlayContainer>
    );
};

ProjectSettingsModal.displayName = 'ProjectSettingsModal';

export default ProjectSettingsModal;
